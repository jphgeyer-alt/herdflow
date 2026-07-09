import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayFastConfig } from "@/lib/payfast/config";
import { createPayFastSignature } from "@/lib/payfast/client";
import { getCommissionRate } from "@/lib/marketplace/commission";
import { sendSellerSaleNotification } from "@/lib/email";
import { formatRand } from "@/lib/marketing/format";
import { env } from "@/lib/env";

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
      const commissionRate = await getCommissionRate();

      const order = await prisma.$transaction(
        async (tx) => {
          const updated = await tx.order.update({
            where: { orderNumber },
            data: {
              status: "PROCESSING",
              paymentReference,
            },
            include: {
              items: {
                include: { product: { include: { seller: { include: { user: true } } } } },
              },
            },
          });

          for (const item of updated.items) {
            const newStock = Math.max(0, item.product.stockOnHand - item.quantity);
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockOnHand: newStock,
                ...(newStock === 0 && { status: "OUT_OF_STOCK" }),
              },
            });

            const commissionCents = Math.round(item.lineTotalCents * commissionRate);
            await tx.orderItem.update({
              where: { id: item.id },
              data: { commissionCents },
            });
          }

          return updated;
        },
        { timeout: 15000 },
      );

      // Notify each seller involved in this order — a side effect kept
      // outside the DB transaction so an email hiccup can't roll back the
      // payment reconciliation.
      const bySeller = new Map<
        string,
        {
          email: string;
          name: string;
          items: { productName: string; quantity: number }[];
          netCents: number;
        }
      >();
      for (const item of order.items) {
        if (!item.product.seller?.user.email) continue;
        const sellerId = item.product.seller.id;
        const commissionCents = Math.round(item.lineTotalCents * commissionRate);
        const netCents = item.lineTotalCents - commissionCents;
        const existing = bySeller.get(sellerId);
        if (existing) {
          existing.items.push({ productName: item.product.name, quantity: item.quantity });
          existing.netCents += netCents;
        } else {
          bySeller.set(sellerId, {
            email: item.product.seller.user.email,
            name: item.product.seller.farmName,
            items: [{ productName: item.product.name, quantity: item.quantity }],
            netCents,
          });
        }
      }

      const dashboardUrl = `${env.NEXT_PUBLIC_SITE_URL || ""}/dashboard/seller`;
      for (const seller of bySeller.values()) {
        await sendSellerSaleNotification({
          to: seller.email,
          sellerName: seller.name,
          orderNumber,
          items: seller.items,
          netAmountLabel: formatRand(seller.netCents / 100),
          dashboardUrl,
        }).catch((err) => console.error("Seller sale notification failed:", err));
      }

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
