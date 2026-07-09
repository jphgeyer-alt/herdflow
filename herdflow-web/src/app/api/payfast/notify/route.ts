import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayFastConfig } from "@/lib/payfast/config";
import { createPayFastSignature } from "@/lib/payfast/client";

function normalizeItnPayload(params: URLSearchParams) {
  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }
  return payload;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const payload = normalizeItnPayload(params);

  const orderNumber = (payload.m_payment_id || payload.payment_id || "").trim();
  const providedSignature = (payload.signature || "").trim().toLowerCase();
  const payFastConfig = await getPayFastConfig();

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
  }

  if (!providedSignature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const fieldsForSignature = { ...payload };
  delete fieldsForSignature.signature;
  const expectedSignature = createPayFastSignature(
    fieldsForSignature,
    payFastConfig.passphrase,
  ).toLowerCase();

  if (expectedSignature !== providedSignature) {
    return NextResponse.json({ error: "Invalid ITN signature." }, { status: 400 });
  }

  const paymentStatus = (payload.payment_status || "").toUpperCase();
  const paymentReference = (payload.pf_payment_id || orderNumber).trim();

  try {
    if (paymentStatus === "COMPLETE") {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { orderNumber },
          data: {
            status: "PROCESSING",
            paymentReference,
          },
          include: { items: { include: { product: true } } },
        });

        for (const item of order.items) {
          const newStock = Math.max(0, item.product.stockOnHand - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockOnHand: newStock,
              ...(newStock === 0 && { status: "OUT_OF_STOCK" }),
            },
          });
        }
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (paymentStatus === "FAILED") {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          status: "FAILED",
          paymentReference,
        },
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (paymentStatus === "CANCELLED") {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          status: "CANCELLED",
          paymentReference,
        },
      });
      return new NextResponse("OK", { status: 200 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to reconcile payment." }, { status: 500 });
  }
}
