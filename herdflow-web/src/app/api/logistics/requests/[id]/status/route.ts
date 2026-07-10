import { NextResponse } from "next/server";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";
import { withLogisticsContext } from "@/lib/tenant-prisma";

type Params = { params: Promise<{ id: string }> };

// Valid forward transitions a partner can trigger themselves.
const TRANSITIONS: Record<string, { next: string; timestampField: "pickedUpAt" | "deliveredAt" }> =
  {
    ASSIGNED: { next: "IN_TRANSIT", timestampField: "pickedUpAt" },
    IN_TRANSIT: { next: "DELIVERED", timestampField: "deliveredAt" },
  };

export async function PATCH(request: Request, { params }: Params) {
  const partner = await getApprovedLogisticsPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };

  try {
    const result = await withLogisticsContext(partner.id, async (tx) => {
      const deliveryRequest = await tx.deliveryRequest.findUnique({ where: { id } });
      if (!deliveryRequest) return { code: "not_found" as const };

      if (deliveryRequest.logisticsPartnerId !== partner.id) {
        return { code: "forbidden" as const };
      }

      const transition = TRANSITIONS[deliveryRequest.status];
      if (!transition || body.status !== transition.next) {
        return { code: "invalid" as const, from: deliveryRequest.status };
      }

      const updated = await tx.deliveryRequest.update({
        where: { id },
        data: {
          status: transition.next as never,
          [transition.timestampField]: new Date(),
        },
      });

      return { code: "ok" as const, updated };
    });

    if (result.code === "not_found")
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });
    if (result.code === "forbidden")
      return NextResponse.json({ error: "This job is not assigned to you." }, { status: 403 });
    if (result.code === "invalid")
      return NextResponse.json(
        { error: `Cannot move from ${result.from} to ${body.status || "(none)"}.` },
        { status: 400 },
      );

    return NextResponse.json({ ok: true, request: result.updated });
  } catch (err) {
    console.error("[logistics/requests/:id/status PATCH]", err);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
