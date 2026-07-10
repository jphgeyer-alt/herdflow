import { NextResponse } from "next/server";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";
import { withLogisticsContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const partner = await getApprovedLogisticsPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const outcome = await withLogisticsContext(partner.id, async (tx) => {
      const deliveryRequest = await tx.deliveryRequest.findUnique({ where: { id } });
      if (!deliveryRequest) return { code: "not_found" as const };

      if (deliveryRequest.status !== "OPEN") {
        return { code: "already_claimed" as const };
      }

      // updateMany with a status guard in the WHERE clause makes this
      // race-free — if two partners claim simultaneously, only the first
      // update matches a still-OPEN row.
      const result = await tx.deliveryRequest.updateMany({
        where: { id, status: "OPEN" },
        data: {
          logisticsPartnerId: partner.id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      });

      if (result.count === 0) {
        return { code: "race_lost" as const };
      }

      const updated = await tx.deliveryRequest.findUnique({ where: { id } });
      return { code: "ok" as const, updated };
    });

    if (outcome.code === "not_found")
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });
    if (outcome.code === "already_claimed")
      return NextResponse.json({ error: "This job has already been claimed." }, { status: 400 });
    if (outcome.code === "race_lost")
      return NextResponse.json(
        { error: "This job was just claimed by another partner." },
        { status: 409 },
      );

    return NextResponse.json({ ok: true, request: outcome.updated });
  } catch {
    return NextResponse.json({ error: "Failed to claim this job." }, { status: 500 });
  }
}
