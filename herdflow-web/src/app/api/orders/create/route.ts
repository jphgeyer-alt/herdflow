import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const items = b.items as
    | Array<{ productId: string; productName: string; priceCents: number; quantity: number }>
    | undefined;
  const customerInfo = b.customerInfo as Record<string, string> | undefined;
  const totalCents = b.totalCents as number | undefined;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  if (!customerInfo || !customerInfo.fullName || !customerInfo.email) {
    return NextResponse.json({ error: "Customer information is required" }, { status: 400 });
  }

  if (!totalCents || totalCents <= 0) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const deliveryMethod = customerInfo.deliveryMethod === "PICKUP" ? "PICKUP" : "DELIVERY";

  if (
    deliveryMethod === "DELIVERY" &&
    (!customerInfo.address || !customerInfo.city || !customerInfo.province)
  ) {
    return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
  }

  try {
    // Require a signed-in user — no guest checkout
    const jar = await cookies();
    const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
    const userId = await getUserIdFromSession(sessionValue);

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to complete your purchase." },
        { status: 401 },
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order
    const order = await withUserContext(userId, (tx) =>
      tx.order.create({
        data: {
          orderNumber,
          userId,
          guestEmail: null,
          status: "PENDING",
          totalCents,
          currency: "ZAR",
          paymentMethod: "PayFast",
          deliveryMethod,
          shippingAddress: customerInfo.address || null,
          shippingCity: customerInfo.city || null,
          shippingProvince: customerInfo.province || null,
          shippingPostalCode: customerInfo.postalCode || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.priceCents,
              lineTotalCents: item.priceCents * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      }),
    );

    // TODO: Initialize PayFast payment
    // In production, redirect to PayFast payment page with order details

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: "Order created successfully",
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 },
    );
  }
}
