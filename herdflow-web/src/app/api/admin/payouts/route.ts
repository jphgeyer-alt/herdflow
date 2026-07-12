import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { withAdminContext } from "@/lib/tenant-prisma";
import { createSellerPayout } from "@/lib/payments/payouts";

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
  } catch (err) {
    console.error("List payouts error:", err);
    return NextResponse.json({ error: "Failed to load payouts." }, { status: 500 });
  }
}

// Snapshots a seller's current released balance (Seller.balance) into a new
// PENDING payout via createSellerPayout() — see src/lib/payments/payouts.ts.
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { sellerId?: string };
  if (!body.sellerId) return NextResponse.json({ error: "sellerId is required." }, { status: 400 });

  try {
    const result = await createSellerPayout(body.sellerId, admin.fullName);
    if (!result) {
      return NextResponse.json({ error: "This seller has no unpaid balance." }, { status: 400 });
    }

    logAdminActivity(admin, "seller_payout.create", "SellerPayout", {
      entityId: result.id,
      entityLabel: result.number,
      metadata: { sellerId: body.sellerId, amountCents: result.amountCents },
    });

    return NextResponse.json({ ok: true, payout: result });
  } catch (err) {
    console.error("Create payout error:", err);
    return NextResponse.json({ error: "Failed to create payout." }, { status: 500 });
  }
}
