import { withAdminContext } from "@/lib/tenant-prisma";
import { Card, CardHeader } from "@/components/admin/Card";
import { Pagination } from "@/components/admin/Pagination";
import { OrdersManager } from "./orders-manager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

async function getOrders(page: number) {
  try {
    const [total, orders] = await Promise.all([
      withAdminContext((tx) => tx.order.count()),
      withAdminContext((tx) =>
        tx.order.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
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
      ),
    ]);

    return { orders, total };
  } catch {
    return { orders: [], total: 0 };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const { orders, total } = await getOrders(page);

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Store Orders</h1>
        <p className="text-sm text-navy-300">
          View and manage all customer orders. Update order status, review items, and track payment
          references.
        </p>
      </header>

      <Card>
        <CardHeader title="All Orders" description={`${total} orders`} />
        <OrdersManager initialOrders={orders} total={total} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/orders" />
      </Card>
    </main>
  );
}
