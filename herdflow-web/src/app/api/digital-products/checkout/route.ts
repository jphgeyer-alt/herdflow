import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payfast/initiate";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    buyerName?: string;
    buyerEmail?: string;
  };

  if (!body.slug || !body.buyerEmail?.trim()) {
    return NextResponse.json({ error: "Product and email are required." }, { status: 400 });
  }

  try {
    const product = await prisma.digitalProduct.findUnique({ where: { slug: body.slug } });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const reference = `DP-${product.id}-${Date.now()}`;
    const placeholderExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const purchase = await prisma.digitalPurchase.create({
      data: {
        productId: product.id,
        buyerEmail: body.buyerEmail.trim(),
        buyerName: body.buyerName?.trim() || null,
        paymentRef: reference,
        expiresAt: placeholderExpiry,
      },
    });

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
    const [firstName, ...rest] = (body.buyerName || "there").trim().split(" ");
    const payment = await initiatePayment({
      reference,
      amount: Number(product.price),
      itemName: `HerdFlow Digital Product — ${product.title}`,
      paymentType: "DIGITAL_PRODUCT",
      returnUrl: `${siteUrl}/resources/${product.slug}?payment=success`,
      cancelUrl: `${siteUrl}/resources/${product.slug}?payment=cancelled`,
      digitalPurchaseId: purchase.id,
      customerFirstName: firstName,
      customerLastName: rest.join(" "),
      customerEmail: body.buyerEmail.trim(),
    });

    return NextResponse.json({ ok: true, payment });
  } catch (err) {
    console.error("Digital product checkout error:", err);
    return NextResponse.json({ error: "Failed to start checkout." }, { status: 500 });
  }
}
