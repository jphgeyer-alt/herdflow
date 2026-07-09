import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  if (orderNumber) {
    try {
      await prisma.order.update({
        where: { orderNumber },
        data: { status: "CANCELLED" },
      });
    } catch {
      // Keep redirect flow even if order update fails.
    }
  }

  return NextResponse.redirect(
    new URL(
      `/checkout?status=cancel&paymentId=${encodeURIComponent(orderNumber || "")}`,
      url.origin,
    ),
  );
}
