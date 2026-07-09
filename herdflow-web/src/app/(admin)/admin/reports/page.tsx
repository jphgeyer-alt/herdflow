import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/marketplace/commission";
import { ReportsPanel } from "./reports-panel";

export const dynamic = "force-dynamic";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

async function getReportData() {
  try {
    const COMMISSION_RATE = await getCommissionRate();

    const [paidOrders, topSellerRows, livestockSales] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
        select: { totalCents: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } } },
        _sum: { lineTotalCents: true },
      }),
      prisma.listing.findMany({
        where: { status: "SOLD" },
        select: { id: true, priceCents: true, seller: { select: { farmName: true } } },
      }),
    ]);

    const months = lastNMonths(12);
    const buckets = new Map<string, number>(months.map((m) => [m, 0]));
    for (const o of paidOrders) {
      const k = monthKey(new Date(o.createdAt));
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + o.totalCents);
    }
    const monthlySales = months.map((m) => ({ month: m, totalCents: buckets.get(m) ?? 0 }));

    const totalRevenueCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
    const livestockCommissionCents = livestockSales.reduce(
      (s, l) => s + Math.round(l.priceCents * COMMISSION_RATE),
      0,
    );
    const productCommissionCents = Math.round(totalRevenueCents * COMMISSION_RATE);
    const totalCommissionCents = productCommissionCents + livestockCommissionCents;

    const productIds = topSellerRows.map((r) => r.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sellerId: true, seller: { select: { farmName: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const sellerRevMap = new Map<string, { name: string; totalCents: number }>();
    for (const row of topSellerRows) {
      const product = productMap.get(row.productId);
      if (!product?.seller) continue;
      const key = product.sellerId ?? product.id;
      const existing = sellerRevMap.get(key);
      sellerRevMap.set(key, {
        name: product.seller.farmName,
        totalCents: (existing?.totalCents ?? 0) + (row._sum.lineTotalCents ?? 0),
      });
    }
    const topSellers = [...sellerRevMap.values()]
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 10);

    return {
      monthlySales,
      totalRevenueCents,
      totalCommissionCents,
      livestockCommissionCents,
      productCommissionCents,
      topSellers,
      livestockSold: livestockSales.length,
      commissionRate: COMMISSION_RATE,
    };
  } catch {
    return {
      monthlySales: [],
      totalRevenueCents: 0,
      totalCommissionCents: 0,
      livestockCommissionCents: 0,
      productCommissionCents: 0,
      topSellers: [],
      livestockSold: 0,
      commissionRate: await getCommissionRate(),
    };
  }
}

export default async function AdminReportsPage() {
  const data = await getReportData();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">Reports</h1>
        <p className="text-sm text-[#38537a]">
          Monthly sales breakdown, {Math.round(data.commissionRate * 100)}% commission tracker, and
          top seller rankings. Export to CSV for accounting.
        </p>
      </header>
      <ReportsPanel data={data} />
    </main>
  );
}
