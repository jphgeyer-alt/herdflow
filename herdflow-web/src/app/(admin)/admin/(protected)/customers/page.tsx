import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/admin/Card";
import { Pagination } from "@/components/admin/Pagination";
import { CustomersManager } from "./customers-manager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

async function getCustomers(page: number) {
  try {
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          marketingConsent: true,
          createdAt: true,
          _count: { select: { orders: true } },
          sellerProfile: { select: { farmName: true, status: true } },
        },
      }),
    ]);

    return { users, total };
  } catch {
    return { users: [], total: 0 };
  }
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const { users, total } = await getCustomers(page);

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Customers</h1>
        <p className="text-sm text-navy-300">
          Browse registered users, view their order count, and check seller registration status.
        </p>
      </header>

      <Card>
        <CardHeader title="All Customers" description={`${total} registered users`} />
        <CustomersManager initialCustomers={users} pageSize={PAGE_SIZE} total={total} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/customers" />
      </Card>
    </main>
  );
}
