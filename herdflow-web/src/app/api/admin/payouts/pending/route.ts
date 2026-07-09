import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

// Per-seller aggregate of unpaid net revenue (sale amount minus platform
// commission) that hasn't been included in a payout batch yet — "who do
// we owe, and how much."
export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await prisma.orderItem.findMany({
      where: {
        payoutId: null,
        order: { status: { in: [...PAID_STATUSES] } },
        product: { sellerId: { not: null } },
      },
      select: {
        lineTotalCents: true,
        commissionCents: true,
        product: { select: { sellerId: true, seller: { select: { farmName: true } } } },
      },
    });

    const bySeller = new Map<string, { sellerId: string; farmName: string; amountCents: number }>();
    for (const item of items) {
      const sellerId = item.product.sellerId;
      if (!sellerId) continue;
      const netCents = item.lineTotalCents - item.commissionCents;
      const existing = bySeller.get(sellerId);
      if (existing) {
        existing.amountCents += netCents;
      } else {
        bySeller.set(sellerId, {
          sellerId,
          farmName: item.product.seller?.farmName || "Unknown Seller",
          amountCents: netCents,
        });
      }
    }

    const pending = [...bySeller.values()]
      .filter((s) => s.amountCents > 0)
      .sort((a, b) => b.amountCents - a.amountCents);

    return NextResponse.json({ pending });
  } catch (err) {
    console.error("Pending payouts error:", err);
    return NextResponse.json({ error: "Failed to load pending balances." }, { status: 500 });
  }
}
