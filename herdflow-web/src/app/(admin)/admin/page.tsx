import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MonthSales = {
  month: string;
  totalCents: number;
};

type DashboardData = {
  totalSalesCents: number;
  pendingSellerRegistrations: number;
  pendingLogisticsRegistrations: number;
  recentOrders: Array<{
    orderNumber: string;
    totalCents: number;
    status: string;
    createdAt: Date;
  }>;
  monthlySales: MonthSales[];
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function buildMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildLastSixMonths() {
  const months: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    months.push(buildMonthKey(d));
  }

  return months;
}

function barWidthClass(totalCents: number, maxMonthly: number) {
  const pct = Math.max(4, Math.round((totalCents / maxMonthly) * 100));

  if (pct >= 95) return "w-full";
  if (pct >= 85) return "w-[90%]";
  if (pct >= 75) return "w-[80%]";
  if (pct >= 65) return "w-[70%]";
  if (pct >= 55) return "w-[60%]";
  if (pct >= 45) return "w-[50%]";
  if (pct >= 35) return "w-[40%]";
  if (pct >= 25) return "w-[30%]";
  if (pct >= 15) return "w-[20%]";
  return "w-[10%]";
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const [pendingSellerRegistrations, pendingLogisticsRegistrations, paidOrders, recentOrders] =
      await Promise.all([
        prisma.seller.count({ where: { status: "PENDING" } }),
        prisma.logisticsPartner.count({ where: { status: "PENDING" } }),
        prisma.order.findMany({
          where: {
            status: {
              in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"],
            },
          },
          select: {
            totalCents: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            orderNumber: true,
            totalCents: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    const totalSalesCents = paidOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const monthBuckets = new Map<string, number>();

    for (const key of buildLastSixMonths()) {
      monthBuckets.set(key, 0);
    }

    for (const order of paidOrders) {
      const key = buildMonthKey(order.createdAt);
      if (!monthBuckets.has(key)) {
        continue;
      }
      monthBuckets.set(key, (monthBuckets.get(key) || 0) + order.totalCents);
    }

    const monthlySales = Array.from(monthBuckets.entries()).map(([month, totalCents]) => ({
      month,
      totalCents,
    }));

    return {
      totalSalesCents,
      pendingSellerRegistrations,
      pendingLogisticsRegistrations,
      recentOrders,
      monthlySales,
    };
  } catch {
    return {
      totalSalesCents: 0,
      pendingSellerRegistrations: 0,
      pendingLogisticsRegistrations: 0,
      recentOrders: [],
      monthlySales: buildLastSixMonths().map((month) => ({ month, totalCents: 0 })),
    };
  }
}

export default async function AdminPage() {
  const data = await getDashboardData();
  const maxMonthly = Math.max(1, ...data.monthlySales.map((month) => month.totalCents));

  return (
    <main className="space-y-5 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-brand-navy text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-[#38537a]">
            Overview of sales, approvals, and current store order activity.
          </p>
        </div>

        <form action="/api/admin/logout" method="post">
          <button
            className="inline-flex rounded-lg border border-[#cdd8e7] px-3 py-2 text-sm font-semibold text-[#244367]"
            type="submit"
          >
            Log Out
          </button>
        </form>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
            Total Sales
          </p>
          <p className="text-brand-gold mt-2 text-2xl font-semibold">
            {toCurrency(data.totalSalesCents)}
          </p>
        </article>

        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
            Pending Sellers
          </p>
          <p className="text-brand-navy mt-2 text-2xl font-semibold">
            {data.pendingSellerRegistrations}
          </p>
        </article>

        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
            Pending Logistics
          </p>
          <p className="text-brand-navy mt-2 text-2xl font-semibold">
            {data.pendingLogisticsRegistrations}
          </p>
        </article>

        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
            Recent Orders
          </p>
          <p className="text-brand-navy mt-2 text-2xl font-semibold">{data.recentOrders.length}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <h2 className="text-brand-navy text-lg font-semibold">Sales by Month (Last 6 Months)</h2>
          <div className="mt-4 grid gap-3">
            {data.monthlySales.map((month) => {
              const widthClass = barWidthClass(month.totalCents, maxMonthly);
              return (
                <div key={month.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#5d7497]">
                    <span>{month.month}</span>
                    <span>{toCurrency(month.totalCents)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#ebf1f9]">
                    <div className={`bg-brand-navy h-3 rounded-full ${widthClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
          <h2 className="text-brand-navy text-lg font-semibold">Recent Orders</h2>

          {data.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-[#5d7497]">No orders found yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recentOrders.map((order) => (
                <li
                  key={order.orderNumber}
                  className="rounded-lg border border-[#e4ebf5] p-3 text-sm"
                >
                  <p className="text-brand-navy font-semibold">{order.orderNumber}</p>
                  <p className="text-[#38537a]">{toCurrency(order.totalCents)}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
                    {order.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Quick navigation */}
      <section>
        <h2 className="text-brand-navy mb-3 text-lg font-semibold">Admin Sections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Listings",
              href: "/admin/listings",
              desc: "Premium livestock listings management — category and seller grouping",
            },
            {
              label: "Products",
              href: "/admin/products",
              desc: "Approve, edit, and feature products & livestock",
            },
            {
              label: "Orders",
              href: "/admin/orders",
              desc: "View and update store order statuses",
            },
            {
              label: "Sellers",
              href: "/admin/sellers",
              desc: "Approve or reject seller registrations",
            },
            {
              label: "Logistics",
              href: "/admin/logistics",
              desc: "Manage logistics partner approvals",
            },
            {
              label: "Customers",
              href: "/admin/customers",
              desc: "Browse registered users and accounts",
            },
            {
              label: "Reports",
              href: "/admin/reports",
              desc: "Revenue, commission, and seller analytics",
            },
            {
              label: "Live Auctions",
              href: "/admin/auctions",
              desc: "Create auction sessions and manage lots",
            },
            {
              label: "Site Content",
              href: "/admin/content",
              desc: "Edit homepage banner and categories",
            },
            {
              label: "Payment Settings",
              href: "/admin/settings/payments",
              desc: "Configure PayFast credentials",
            },
            {
              label: "Marketing & Sponsors",
              href: "/admin/marketing",
              desc: "Review sponsorship applications and manage active sponsors",
            },
            {
              label: "Seller Payouts",
              href: "/admin/payouts",
              desc: "Track and settle what HerdFlow owes each seller",
            },
            {
              label: "Expenses",
              href: "/admin/expenses",
              desc: "Record business costs and view Profit & Loss",
            },
            {
              label: "📱 Mobile App Content",
              href: "/admin/app-content",
              desc: "Push announcements, banners, tips and notifications to farmer phones",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:border-brand-navy flex flex-col rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-brand-navy font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-[#5d7497]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
