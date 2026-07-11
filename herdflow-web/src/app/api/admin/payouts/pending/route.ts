import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Per-seller released balance not yet included in a payout batch — reads
// Seller.balance directly (credited by releaseFunds()/confirmOrderReceived()
// in src/lib/payments/payouts.ts) so this always matches what a payout
// batch will actually pay out.
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sellers = await prisma.seller.findMany({
      where: { balance: { gt: 0 } },
      select: { id: true, farmName: true, balance: true },
      orderBy: { balance: "desc" },
    });

    const pending = sellers.map((s) => ({
      sellerId: s.id,
      farmName: s.farmName,
      amountCents: Math.round(Number(s.balance) * 100),
    }));

    return NextResponse.json({ pending });
  } catch (err) {
    console.error("Pending payouts error:", err);
    return NextResponse.json({ error: "Failed to load pending balances." }, { status: 500 });
  }
}
