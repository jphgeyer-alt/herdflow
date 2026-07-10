import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { withAdminContext } from "@/lib/tenant-prisma";

function ensureAdmin(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

// Per-partner aggregate of unpaid net transport fees (price minus platform
// commission) for delivered jobs not yet included in a payout batch.
export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const deliveries = await withAdminContext((tx) =>
      tx.deliveryRequest.findMany({
        where: {
          payoutId: null,
          status: "DELIVERED",
          logisticsPartnerId: { not: null },
        },
        select: {
          priceCents: true,
          commissionCents: true,
          logisticsPartnerId: true,
          logisticsPartner: { select: { companyName: true } },
        },
      }),
    );

    const byPartner = new Map<
      string,
      { logisticsPartnerId: string; companyName: string; amountCents: number }
    >();
    for (const delivery of deliveries) {
      const partnerId = delivery.logisticsPartnerId;
      if (!partnerId) continue;
      const netCents = delivery.priceCents - delivery.commissionCents;
      const existing = byPartner.get(partnerId);
      if (existing) {
        existing.amountCents += netCents;
      } else {
        byPartner.set(partnerId, {
          logisticsPartnerId: partnerId,
          companyName: delivery.logisticsPartner?.companyName || "Unknown Partner",
          amountCents: netCents,
        });
      }
    }

    const pending = [...byPartner.values()]
      .filter((p) => p.amountCents > 0)
      .sort((a, b) => b.amountCents - a.amountCents);

    return NextResponse.json({ pending });
  } catch (err) {
    console.error("Pending logistics payouts error:", err);
    return NextResponse.json({ error: "Failed to load pending balances." }, { status: 500 });
  }
}
