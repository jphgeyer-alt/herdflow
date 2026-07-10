import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getNextDocumentNumber } from "@/lib/document-number";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payouts = await withAdminContext((tx) =>
      tx.sellerPayout.findMany({
        include: { seller: { select: { farmName: true } } },
        orderBy: { createdAt: "desc" },
      }),
    );
    return NextResponse.json({ payouts });
  } catch {
    return NextResponse.json({ error: "Failed to load payouts." }, { status: 500 });
  }
}

// Snapshots a seller's current unpaid balance into a new PENDING payout,
// and stamps every unpaid OrderItem with the new payoutId in the same
// transaction — locks the batch so later sales don't leak into it while
// it's being settled.
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { sellerId?: string };
  if (!body.sellerId) return NextResponse.json({ error: "sellerId is required." }, { status: 400 });

  try {
    const seller = await prisma.seller.findUnique({ where: { id: body.sellerId } });
    if (!seller) return NextResponse.json({ error: "Seller not found." }, { status: 404 });

    const unpaidItems = await prisma.orderItem.findMany({
      where: {
        payoutId: null,
        order: { status: { in: [...PAID_STATUSES] } },
        product: { sellerId: body.sellerId },
      },
      select: { id: true, lineTotalCents: true, commissionCents: true },
    });

    const amountCents = unpaidItems.reduce(
      (sum, i) => sum + (i.lineTotalCents - i.commissionCents),
      0,
    );

    if (unpaidItems.length === 0 || amountCents <= 0) {
      return NextResponse.json({ error: "This seller has no unpaid balance." }, { status: 400 });
    }

    const createdBy = admin.fullName;

    const payout = await withAdminContext(async (tx) => {
      const number = await getNextDocumentNumber(tx, "payout");
      const created = await tx.sellerPayout.create({
        data: {
          number,
          sellerId: body.sellerId!,
          amountCents,
          createdBy,
        },
      });
      await tx.orderItem.updateMany({
        where: { id: { in: unpaidItems.map((i) => i.id) } },
        data: { payoutId: created.id },
      });
      return created;
    });

    logAdminActivity(admin, "seller_payout.create", "SellerPayout", {
      entityId: payout.id,
      entityLabel: payout.number,
      metadata: { sellerId: body.sellerId, amountCents },
    });

    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    console.error("Create payout error:", err);
    return NextResponse.json({ error: "Failed to create payout." }, { status: 500 });
  }
}
