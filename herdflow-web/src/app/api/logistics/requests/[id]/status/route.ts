import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApprovedLogisticsPartner } from "@/lib/logistics-auth";

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
    const deliveryRequest = await prisma.deliveryRequest.findUnique({ where: { id } });
    if (!deliveryRequest)
      return NextResponse.json({ error: "Delivery request not found" }, { status: 404 });

    if (deliveryRequest.logisticsPartnerId !== partner.id) {
      return NextResponse.json({ error: "This job is not assigned to you." }, { status: 403 });
    }

    const transition = TRANSITIONS[deliveryRequest.status];
    if (!transition || body.status !== transition.next) {
      return NextResponse.json(
        {
          error: `Cannot move from ${deliveryRequest.status} to ${body.status || "(none)"}.`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.deliveryRequest.update({
      where: { id },
      data: {
        status: transition.next as never,
        [transition.timestampField]: new Date(),
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    console.error("[logistics/requests/:id/status PATCH]", err);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
