import Link from "next/link";
import { withAdminContext } from "@/lib/tenant-prisma";
import { formatRand } from "@/lib/marketing/format";
import { getMrr } from "@/lib/reports/mrr";
import { monthKey, lastNMonths } from "@/lib/reports/business-report";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { RevenueByStreamChart } from "@/components/admin/charts/RevenueByStreamChart";
import { SubscriptionRevenueByMonthChart } from "@/components/admin/charts/SubscriptionRevenueByMonthChart";
import { TrendingUp, DollarSign, Calendar, Download } from "lucide-react";

export const dynamic = "force-dynamic";

const STREAM_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Subscriptions",
  STORE_ORDER: "Shop Orders (commission)",
  LISTING_FEE: "Listing Fees",
  TRANSPORT_BOOKING: "Transport Booking Fees",
  SPONSORSHIP: "Sponsorships",
  VENDOR_REG: "Vendor Registrations",
};

export default async function AdminRevenuePage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ mrr, activeSubscriptions }, streamTotals, monthTotals, allTimeAgg, subscriptionPayments] =
    await Promise.all([
      getMrr(),
      withAdminContext((tx) =>
        tx.payment.groupBy({
          by: ["paymentType"],
          where: { status: "COMPLETE" },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ),
      withAdminContext((tx) =>
        tx.payment.aggregate({
          where: { status: "COMPLETE", paidAt: { gte: monthStart } },
          _sum: { amount: true },
        }),
      ),
      withAdminContext((tx) =>
        tx.payment.aggregate({
          where: { status: "COMPLETE" },
          _sum: { amount: true },
        }),
      ),
      withAdminContext((tx) =>
        tx.payment.findMany({
          where: { status: "COMPLETE", paymentType: "SUBSCRIPTION", paidAt: { not: null } },
          select: { amount: true, paidAt: true },
        }),
      ),
    ]);

  const totalRevenue = Number(allTimeAgg._sum.amount ?? 0);
  const monthRevenue = Number(monthTotals._sum.amount ?? 0);

  const streams = streamTotals
    .map((s) => ({
      type: s.paymentType,
      label: STREAM_LABELS[s.paymentType] ?? s.paymentType,
      count: s._count._all,
      total: Number(s._sum.amount ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const months = lastNMonths(12);
  const subscriptionBuckets = new Map<string, number>(months.map((m) => [m, 0]));
  for (const p of subscriptionPayments) {
    const key = monthKey(new Date(p.paidAt!));
    if (subscriptionBuckets.has(key)) {
      subscriptionBuckets.set(key, (subscriptionBuckets.get(key) ?? 0) + Number(p.amount));
    }
  }
  const subscriptionRevenueByMonth = months.map((m) => ({
    month: m,
    total: subscriptionBuckets.get(m) ?? 0,
  }));

  return (
    <main className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-navy-600 text-3xl font-semibold">Revenue</h1>
          <p className="text-sm text-navy-300">MRR and revenue by stream, across every payment type.</p>
        </header>
        <Link
          href="/api/admin/revenue/export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-25"
        >
          <Download size={14} /> Export CSV
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="MRR"
          value={formatRand(mrr)}
          icon={<TrendingUp size={18} />}
          accent="green"
          hint={`${activeSubscriptions} active subscriptions`}
        />
        <StatCard
          label="Revenue This Month"
          value={formatRand(monthRevenue)}
          icon={<Calendar size={18} />}
          accent="gold"
        />
        <StatCard
          label="Total Revenue (all time)"
          value={formatRand(totalRevenue)}
          icon={<DollarSign size={18} />}
          accent="navy"
        />
      </div>

      <Card>
        <CardHeader
          title="Subscription Revenue by Month"
          description="Completed subscription payments per month — not a point-in-time MRR snapshot."
        />
        <div className="p-4 pt-0">
          <SubscriptionRevenueByMonthChart data={subscriptionRevenueByMonth} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Revenue by Stream" description="All-time, completed payments only." />
        <div className="p-4 pt-0">
          <RevenueByStreamChart streams={streams} />
        </div>
        <Table>
          <Thead>
            <Tr>
              <Th>Stream</Th>
              <Th>Payments</Th>
              <Th>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {streams.length === 0 ? (
              <TableEmptyRow colSpan={3} message="No completed payments yet." />
            ) : (
              streams.map((s) => (
                <Tr key={s.type}>
                  <Td className="font-semibold text-navy-600">{s.label}</Td>
                  <Td>{s.count}</Td>
                  <Td className="font-bold text-navy-600">{formatRand(s.total)}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </main>
  );
}
