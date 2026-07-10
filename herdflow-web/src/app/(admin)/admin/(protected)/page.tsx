import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Store,
  Truck,
  Wallet,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBusinessReportData, monthKey } from "@/lib/reports/business-report";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { BarChart } from "@/components/admin/BarChart";
import { StatusBadge } from "@/components/admin/Badge";
import { ADMIN_NAV_FLAT } from "@/lib/admin-nav";

export const dynamic = "force-dynamic";

const PAID_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function getOpsData() {
  try {
    const [pendingSellerPayout, pendingLogisticsPayout, openDeliveryRequests, recentOrders] =
      await Promise.all([
        prisma.orderItem.aggregate({
          where: { payoutId: null, order: { status: { in: [...PAID_ORDER_STATUSES] } } },
          _sum: { lineTotalCents: true, commissionCents: true },
        }),
        prisma.deliveryRequest.aggregate({
          where: { payoutId: null, status: "DELIVERED" },
          _sum: { priceCents: true, commissionCents: true },
        }),
        prisma.deliveryRequest.count({ where: { status: "OPEN" } }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { orderNumber: true, totalCents: true, status: true, createdAt: true },
        }),
      ]);

    const pendingSellerPayoutCents =
      (pendingSellerPayout._sum.lineTotalCents ?? 0) - (pendingSellerPayout._sum.commissionCents ?? 0);
    const pendingLogisticsPayoutCents =
      (pendingLogisticsPayout._sum.priceCents ?? 0) - (pendingLogisticsPayout._sum.commissionCents ?? 0);

    return {
      pendingSellerPayoutCents,
      pendingLogisticsPayoutCents,
      openDeliveryRequests,
      recentOrders,
    };
  } catch {
    return {
      pendingSellerPayoutCents: 0,
      pendingLogisticsPayoutCents: 0,
      openDeliveryRequests: 0,
      recentOrders: [] as Array<{
        orderNumber: string;
        totalCents: number;
        status: string;
        createdAt: Date;
      }>,
    };
  }
}

export default async function AdminPage() {
  const [report, ops, pendingSellers, pendingLogistics] = await Promise.all([
    getBusinessReportData(),
    getOpsData(),
    prisma.seller.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.logisticsPartner.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  const last6 = report.monthlySales.slice(-6);
  const thisMonthKey = monthKey(new Date());
  const thisMonth = report.monthlyPnl.find((m) => m.month === thisMonthKey);

  return (
    <main className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-navy-300">Sales, approvals, and operational activity at a glance.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross Sales (12mo)"
          value={toCurrency(report.totalRevenueCents)}
          icon={<DollarSign size={18} />}
          accent="gold"
        />
        <StatCard
          label="Net Profit (this month)"
          value={toCurrency(thisMonth?.netProfitCents ?? 0)}
          icon={<TrendingUp size={18} />}
          accent="green"
          hint={`Commission ${toCurrency(thisMonth?.commissionCents ?? 0)} + marketing ${toCurrency(thisMonth?.marketingCents ?? 0)} − expenses ${toCurrency(thisMonth?.expenseCents ?? 0)}`}
        />
        <StatCard
          label="Pending Payouts"
          value={toCurrency(ops.pendingSellerPayoutCents + ops.pendingLogisticsPayoutCents)}
          icon={<Wallet size={18} />}
          accent="navy"
          hint={`Sellers ${toCurrency(ops.pendingSellerPayoutCents)} · Logistics ${toCurrency(ops.pendingLogisticsPayoutCents)}`}
        />
        <StatCard
          label="Open Delivery Jobs"
          value={ops.openDeliveryRequests}
          icon={<Truck size={18} />}
          accent={ops.openDeliveryRequests > 0 ? "danger" : "navy"}
        />
        <StatCard
          label="Pending Sellers"
          value={pendingSellers}
          icon={<Store size={18} />}
          accent={pendingSellers > 0 ? "danger" : "navy"}
        />
        <StatCard
          label="Pending Logistics"
          value={pendingLogistics}
          icon={<Truck size={18} />}
          accent={pendingLogistics > 0 ? "danger" : "navy"}
        />
        <StatCard
          label="Livestock Sold (12mo)"
          value={report.livestockSold}
          icon={<PackageSearch size={18} />}
          accent="navy"
        />
        <StatCard
          label="Recent Orders"
          value={ops.recentOrders.length}
          icon={<ShoppingCart size={18} />}
          accent="navy"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Gross Sales — Last 6 Months" action={<Link href="/admin/reports" className="text-sm font-semibold text-navy-600 hover:underline">Full report →</Link>} />
          <div className="p-4">
            <BarChart
              data={last6.map((m) => ({ label: m.month.slice(5), value: m.totalCents }))}
              format="zar-cents"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Orders" />
          <div className="divide-y divide-navy-50">
            {ops.recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-navy-300">No orders found yet.</p>
            ) : (
              ops.recentOrders.map((order) => (
                <div key={order.orderNumber} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-navy-600 text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-navy-300">{toCurrency(order.totalCents)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-navy-600 mb-3 text-lg font-semibold">Admin Sections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_NAV_FLAT.filter((item) => item.href !== "/admin").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="hover:border-navy-600 flex flex-col rounded-xl border border-navy-50 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <Icon size={18} className="text-navy-600 mb-2" />
                <p className="text-navy-600 font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-navy-300">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
