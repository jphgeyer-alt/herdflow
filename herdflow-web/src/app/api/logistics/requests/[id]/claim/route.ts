import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const partner = await getApprovedLogisticsPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deliveryRequest = await prisma.deliveryRequest.findUnique({ where: { id } });
    if (!deliveryRequest)
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });

    if (deliveryRequest.status !== "OPEN") {
      return NextResponse.json({ error: "This job has already been claimed." }, { status: 400 });
    }

    // updateMany with a status guard in the WHERE clause makes this
    // race-free — if two partners claim simultaneously, only the first
    // update matches a still-OPEN row.
    const result = await prisma.deliveryRequest.updateMany({
      where: { id, status: "OPEN" },
      data: {
        logisticsPartnerId: partner.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "This job was just claimed by another partner." },
        { status: 409 },
      );
    }

    const updated = await prisma.deliveryRequest.findUnique({ where: { id } });
    return NextResponse.json({ ok: true, request: updated });
  } catch {
    return NextResponse.json({ error: "Failed to claim this job." }, { status: 500 });
  }
}
