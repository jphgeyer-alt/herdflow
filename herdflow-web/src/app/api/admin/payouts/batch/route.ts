import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/admin-activity";
import { createPayoutBatch } from "@/lib/payments/payouts";

// Creates a PENDING SellerPayout for every seller with a released balance
// over the R100 minimum, and returns the resulting bank CSV for upload to
// internet banking. See src/lib/payments/payouts.ts.
export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { payouts, csv } = await createPayoutBatch(admin.fullName);

    logAdminActivity(admin, "seller_payout.batch_create", "SellerPayout", {
      metadata: { payouts },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="seller-payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Payout batch error:", err);
    return NextResponse.json({ error: "Failed to create payout batch." }, { status: 500 });
  }
}
