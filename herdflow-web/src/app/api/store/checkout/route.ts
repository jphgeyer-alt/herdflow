import { NextResponse } from "next/server";
import { buildPayFastInitializePayload, getPayFastProcessUrl } from "@/lib/payfast/client";
import { buildCartItems, calculateCartTotals, parseCartParam } from "@/lib/storefront-cart";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getPayFastConfig } from "@/lib/payfast/config";

type CheckoutBody = {
  cart?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

function getBaseUrl(request: Request) {
  // Use env NEXT_PUBLIC_SITE_URL if available (production), otherwise extract from request
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL;
  }
  const requestUrl = new URL(request.url);
  return `${requestUrl.protocol}//${requestUrl.host}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const cart = parseCartParam(body.cart);
  const items = await buildCartItems(cart);

  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty or invalid." }, { status: 400 });
  }

  const firstName = (body.customer?.firstName || "").trim();
  const lastName = (body.customer?.lastName || "").trim();
  const email = (body.customer?.email || "").trim();

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Customer name and email are required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const totals = calculateCartTotals(items);
  const paymentId = `HF-${Date.now()}`;
  const baseUrl = getBaseUrl(request);
  const payFastConfig = await getPayFastConfig();

  if (!payFastConfig.merchantId || !payFastConfig.merchantKey) {
    return NextResponse.json(
      { error: "PayFast merchant configuration is missing." },
      { status: 500 },
    );
  }

  try {
    await prisma.order.create({
      data: {
        orderNumber: paymentId,
        guestEmail: email.toLowerCase(),
        status: "PENDING",
        totalCents: Math.round(totals.subtotal * 100),
        currency: "ZAR",
        paymentMethod: "PayFast",
        paymentReference: paymentId,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
          })),
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create order for checkout." }, { status: 500 });
  }

  const payload = buildPayFastInitializePayload(
    {
      amount: totals.subtotal,
      itemName: `HerdFlow Store Order (${totals.totalItems} item${totals.totalItems > 1 ? "s" : ""})`,
      paymentId,
      returnUrl: `${baseUrl}/api/payfast/return?orderNumber=${encodeURIComponent(paymentId)}`,
      cancelUrl: `${baseUrl}/api/payfast/cancel?orderNumber=${encodeURIComponent(paymentId)}`,
      notifyUrl: `${baseUrl}/api/payfast/notify`,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerEmail: email,
    },
    payFastConfig,
  );

  return NextResponse.json({
    processUrl: getPayFastProcessUrl(payFastConfig),
    fields: payload,
    orderReference: paymentId,
  });
}
