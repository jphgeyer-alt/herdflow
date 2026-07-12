import { NextResponse } from "next/server";
import { withAdminContext } from "@/lib/tenant-prisma";

function readOrderNumber(url: URL) {
  return (
    url.searchParams.get("orderNumber") ||
    url.searchParams.get("m_payment_id") ||
    url.searchParams.get("payment_id") ||
    ""
  ).trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = readOrderNumber(url);
  const paymentReference = (url.searchParams.get("pf_payment_id") || "").trim();

  if (orderNumber) {
    try {
      // Order has FORCE ROW LEVEL SECURITY — this is the buyer's unauthenticated
      // browser redirect back from PayFast, so it must bypass RLS explicitly.
      await withAdminContext((tx) =>
        tx.order.update({
          where: { orderNumber },
          data: {
            status: "PAID",
            paymentReference: paymentReference || orderNumber,
          },
        }),
      );
    } catch {
      // Keep redirect flow even if order update fails.
    }
  }

  return NextResponse.redirect(
    new URL(`/orders/${encodeURIComponent(orderNumber || "unknown")}`, url.origin),
  );
}
