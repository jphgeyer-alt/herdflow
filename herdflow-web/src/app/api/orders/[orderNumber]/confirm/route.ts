import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserIdFromSession, USER_SESSION_COOKIE } from "@/lib/user-auth";
import { withUserContext } from "@/lib/tenant-prisma";
import { confirmOrderReceived } from "@/lib/payments/payouts";

type RouteParams = { params: Promise<{ orderNumber: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { orderNumber } = await params;

  const jar = await cookies();
  const sessionValue = jar.get(USER_SESSION_COOKIE)?.value;
  const userId = await getUserIdFromSession(sessionValue);

  if (!userId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const order = await withUserContext(userId, (tx) =>
    tx.order.findUnique({ where: { orderNumber }, select: { id: true, userId: true, status: true } }),
  );

  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "SHIPPED") {
    return NextResponse.json(
      { error: "This order can only be confirmed once it has been shipped." },
      { status: 400 },
    );
  }

  try {
    await confirmOrderReceived(order.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Confirm received error:", err);
    return NextResponse.json({ error: "Failed to confirm order." }, { status: 500 });
  }
}
