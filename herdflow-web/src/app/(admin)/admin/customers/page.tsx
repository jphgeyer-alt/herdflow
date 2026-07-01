import { prisma } from "@/lib/prisma";
import { CustomersManager } from "./customers-manager";

export const dynamic = "force-dynamic";

async function getCustomers() {
  try {
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
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

export default async function AdminCustomersPage() {
  const { users, total } = await getCustomers();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-brand-navy">Customers</h1>
        <p className="text-sm text-[#38537a]">
          Browse registered users, view their order count, and check seller registration status.
        </p>
      </header>

      <CustomersManager initialCustomers={users} initialTotal={total} />
    </main>
  );
}

