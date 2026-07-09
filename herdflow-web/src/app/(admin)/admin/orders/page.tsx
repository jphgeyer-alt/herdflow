import { prisma } from "@/lib/prisma";
import { OrdersManager } from "./orders-manager";

export const dynamic = "force-dynamic";

async function getOrders() {
  try {
    const [total, orders] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          user: { select: { fullName: true, email: true } },
          items: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
          deliveryRequest: { select: { id: true, status: true } },
        },
      }),
    ]);

    return { orders, total };
  } catch {
    return { orders: [], total: 0 };
  }
}

export default async function AdminOrdersPage() {
  const { orders, total } = await getOrders();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">Store Orders</h1>
        <p className="text-sm text-[#38537a]">
          View and manage all customer orders. Update order status, review items, and track payment
          references.
        </p>
      </header>

      <OrdersManager initialOrders={orders} initialTotal={total} />
    </main>
  );
}
