import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayFastConfig } from "@/lib/payfast/config";
import { createPayFastSignature } from "@/lib/payfast/client";
import { isValidPayFastSourceIp, getRequestIp, confirmWithPayFast } from "@/lib/payfast/security";
import { getCommissionRate } from "@/lib/marketplace/commission";
import { sendSellerSaleNotification, sendOrderConfirmationEmail, sendListingLiveEmail } from "@/lib/email";
import { formatRand } from "@/lib/marketing/format";
import { env } from "@/lib/env";
import type { Payment } from "@prisma/client";

function normalizeItnPayload(params: URLSearchParams) {
  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }
  return payload;
}

// ── Per-paymentType completion handlers ──────────────────────────────────────
// Each runs only once (the caller checks payment.status !== "COMPLETE" first,
// and PayFast's own ITN retries are otherwise idempotent since re-running
// these against an already-updated row is harmless — e.g. re-setting
// feePaid=true twice is a no-op).

async function completeStoreOrder(orderId: string) {
  const commissionRate = await getCommissionRate();

  const order = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
        include: {
          user: { select: { fullName: true, email: true } },
          items: { include: { product: { include: { seller: { include: { user: true } } } } } },
        },
      });

      for (const item of updated.items) {
        const newStock = Math.max(0, item.product.stockOnHand - item.quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: { stockOnHand: newStock, ...(newStock === 0 && { status: "OUT_OF_STOCK" }) },
        });

        const commissionCents = Math.round(item.lineTotalCents * commissionRate);
        await tx.orderItem.update({ where: { id: item.id }, data: { commissionCents } });
      }

      return updated;
    },
    { timeout: 15000 },
  );

  const bySeller = new Map<
    string,
    { email: string; name: string; items: { productName: string; quantity: number }[]; netCents: number }
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
      orderNumber: order.orderNumber,
      items: seller.items,
      netAmountLabel: formatRand(seller.netCents / 100),
      dashboardUrl,
    }).catch((err) => console.error("Seller sale notification failed:", err));
  }

  const buyerEmail = order.user?.email || order.guestEmail;
  if (buyerEmail) {
    await sendOrderConfirmationEmail({
      to: buyerEmail,
      buyerName: order.user?.fullName || "there",
      orderNumber: order.orderNumber,
      totalLabel: formatRand(order.totalCents / 100),
      trackingUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/orders/${order.orderNumber}`,
    }).catch((err) => console.error("Order confirmation email failed:", err));
  }
}

async function completeSubscription(subscriptionId: string, payment: Payment) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription) return;

  const periodDays = subscription.billingCycle === "ANNUAL" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodEnd,
      payfastToken: (payment.metadata as Record<string, unknown> | null)?.token as string | undefined,
    },
  });
}

async function completeListingFee(listingId: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", feePaid: true, expiresAt },
    include: { seller: { include: { user: { select: { fullName: true, email: true } } } } },
  });

  if (listing.seller.user.email) {
    await sendListingLiveEmail({
      to: listing.seller.user.email,
      sellerName: listing.seller.farmName,
      listingTitle: listing.title,
      viewUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/listings/${listing.slug}`,
    }).catch((err) => console.error("Listing live email failed:", err));
  }
}

async function completeTransportBooking(deliveryRequestId: string) {
  await prisma.deliveryRequest.update({
    where: { id: deliveryRequestId },
    data: { bookingFeePaid: true },
  });
}

async function completeVendorReg(sellerId: string) {
  await prisma.seller.update({
    where: { id: sellerId },
    data: { registrationFeePaid: true },
  });
}

async function completeSponsorship(invoiceId: string) {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });
}

// ── Legacy fallback ───────────────────────────────────────────────────────────
// Orders placed before checkout created a Payment row per attempt (i.e. any
// order that predates this change) used Order.orderNumber directly as
// m_payment_id with no Payment row backing it. Kept only for that narrow
// backward-compatibility window — new STORE_ORDER payments always go through
// the Payment-row path above.
async function handleLegacyOrderNotify(orderNumber: string, paymentStatus: string, paymentReference: string) {
  if (paymentStatus === "COMPLETE") {
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) return;
    await prisma.order.update({ where: { orderNumber }, data: { paymentReference } });
    await completeStoreOrder(order.id);
  } else if (paymentStatus === "FAILED") {
    await prisma.order.update({ where: { orderNumber }, data: { status: "FAILED", paymentReference } });
  } else if (paymentStatus === "CANCELLED") {
    await prisma.order.update({ where: { orderNumber }, data: { status: "CANCELLED", paymentReference } });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const payload = normalizeItnPayload(params);

  const reference = (payload.m_payment_id || payload.payment_id || "").trim();
  const providedSignature = (payload.signature || "").trim().toLowerCase();
  const payFastConfig = await getPayFastConfig();

  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
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

  // Source-IP validation — a correct signature alone doesn't prove the
  // request came from PayFast's own servers.
  const sourceIp = getRequestIp(request);
  const ipOk = await isValidPayFastSourceIp(sourceIp);
  if (!ipOk) {
    console.error("PayFast ITN rejected: source IP not recognized as PayFast:", sourceIp);
    return NextResponse.json({ error: "Invalid source." }, { status: 400 });
  }

  // Server-to-server confirmation — post the raw ITN back to PayFast and
  // require "VALID" before trusting anything in it.
  const confirmed = await confirmWithPayFast(rawBody, env.PAYFAST_SANDBOX);
  if (!confirmed) {
    console.error("PayFast ITN rejected: server-to-server confirmation failed.");
    return NextResponse.json({ error: "Could not confirm with PayFast." }, { status: 400 });
  }

  const paymentStatus = (payload.payment_status || "").toUpperCase();
  const pfPaymentId = (payload.pf_payment_id || reference).trim();

  try {
    const payment = await prisma.payment.findUnique({ where: { reference } });

    if (!payment) {
      await handleLegacyOrderNotify(reference, paymentStatus, pfPaymentId);
      return new NextResponse("OK", { status: 200 });
    }

    // Idempotent — PayFast retries ITNs; a payment already marked COMPLETE
    // should never be reprocessed.
    if (payment.status === "COMPLETE") {
      return new NextResponse("OK", { status: 200 });
    }

    if (paymentStatus === "COMPLETE") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETE", payfastId: pfPaymentId, paidAt: new Date() },
      });

      switch (payment.paymentType) {
        case "STORE_ORDER":
          if (payment.orderId) await completeStoreOrder(payment.orderId);
          break;
        case "SUBSCRIPTION":
          if (payment.subscriptionId) await completeSubscription(payment.subscriptionId, payment);
          break;
        case "LISTING_FEE":
          if (payment.listingId) await completeListingFee(payment.listingId);
          break;
        case "TRANSPORT_BOOKING":
          if (payment.deliveryRequestId) await completeTransportBooking(payment.deliveryRequestId);
          break;
        case "VENDOR_REG":
          if (payment.sellerId) await completeVendorReg(payment.sellerId);
          break;
        case "SPONSORSHIP":
          if (payment.invoiceId) await completeSponsorship(payment.invoiceId);
          break;
      }
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      // PayStatus has no CANCELLED value — a cancelled attempt is treated
      // the same as FAILED (neither resulted in a completed payment).
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("PayFast ITN processing failed:", err);
    return NextResponse.json({ error: "Failed to reconcile payment." }, { status: 500 });
  }
}
