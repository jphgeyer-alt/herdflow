import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminUsername, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payouts = await prisma.logisticsPayout.findMany({
      include: { logisticsPartner: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ payouts });
  } catch {
    return NextResponse.json({ error: "Failed to load payouts." }, { status: 500 });
  }
}

// Snapshots a logistics partner's unpaid balance (delivered jobs not yet in
// a payout batch) into a new PENDING payout, and stamps every covered
// DeliveryRequest with the new payoutId in the same transaction — mirrors
// the seller payout flow so the same double-payment protection applies.
export async function POST(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { logisticsPartnerId?: string };
  if (!body.logisticsPartnerId)
    return NextResponse.json({ error: "logisticsPartnerId is required." }, { status: 400 });

  try {
    const partner = await prisma.logisticsPartner.findUnique({
      where: { id: body.logisticsPartnerId },
    });
    if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    const unpaidDeliveries = await prisma.deliveryRequest.findMany({
      where: {
        payoutId: null,
        status: "DELIVERED",
        logisticsPartnerId: body.logisticsPartnerId,
      },
      select: { id: true, priceCents: true, commissionCents: true },
    });

    const amountCents = unpaidDeliveries.reduce(
      (sum, d) => sum + (d.priceCents - d.commissionCents),
      0,
    );

    if (unpaidDeliveries.length === 0 || amountCents <= 0) {
      return NextResponse.json({ error: "This partner has no unpaid balance." }, { status: 400 });
    }

    const createdBy = getAdminUsername(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    const payout = await prisma.$transaction(async (tx) => {
      const number = await getNextDocumentNumber(tx, "logistics-payout");
      const created = await tx.logisticsPayout.create({
        data: {
          number,
          logisticsPartnerId: body.logisticsPartnerId!,
          amountCents,
          createdBy,
        },
      });
      await tx.deliveryRequest.updateMany({
        where: { id: { in: unpaidDeliveries.map((d) => d.id) } },
        data: { payoutId: created.id },
      });
      return created;
    });

    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    console.error("Create logistics payout error:", err);
    return NextResponse.json({ error: "Failed to create payout." }, { status: 500 });
  }
}
