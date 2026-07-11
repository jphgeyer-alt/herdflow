import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payouts = await withAdminContext((tx) =>
      tx.logisticsPayout.findMany({
        include: { logisticsPartner: { select: { companyName: true } } },
        orderBy: { createdAt: "desc" },
      }),
    );
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
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { logisticsPartnerId?: string };
  if (!body.logisticsPartnerId)
    return NextResponse.json({ error: "logisticsPartnerId is required." }, { status: 400 });

  try {
    const partner = await prisma.logisticsPartner.findUnique({
      where: { id: body.logisticsPartnerId },
    });
    if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

    const createdBy = admin.fullName;

    const payout = await withAdminContext(async (tx) => {
      const unpaidDeliveries = await tx.deliveryRequest.findMany({
        where: {
          payoutId: null,
          status: "DELIVERED",
          logisticsPartnerId: body.logisticsPartnerId,
        },
        select: { id: true, priceCents: true, commissionCents: true },
      });

      const amountCents = unpaidDeliveries.reduce(
        (sum, d) => sum + ((d.priceCents ?? 0) - d.commissionCents),
        0,
      );

      if (unpaidDeliveries.length === 0 || amountCents <= 0) {
        return null;
      }

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

    if (!payout) {
      return NextResponse.json({ error: "This partner has no unpaid balance." }, { status: 400 });
    }

    logAdminActivity(admin, "logistics_payout.create", "LogisticsPayout", {
      entityId: payout.id,
      entityLabel: payout.number,
      metadata: { logisticsPartnerId: body.logisticsPartnerId },
    });

    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    console.error("Create logistics payout error:", err);
    return NextResponse.json({ error: "Failed to create payout." }, { status: 500 });
  }
}
