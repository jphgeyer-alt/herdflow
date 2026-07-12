import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getCommissionRate, getVatConfig, calculateVatCents } from "@/lib/marketplace/commission";
import { randToCents } from "@/lib/money";

const PAID_ORDER_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

const EMPTY_REPORT = {
  monthlySales: [] as { month: string; totalCents: number }[],
  totalRevenueCents: 0,
  totalCommissionCents: 0,
  livestockCommissionCents: 0,
  productCommissionCents: 0,
  topSellers: [] as { name: string; totalCents: number }[],
  livestockSold: 0,
  commissionRate: 0,
  marketingRevenueCents: 0,
  expensesCents: 0,
  netProfitCents: 0,
  expensesByCategory: [] as { category: string; totalCents: number }[],
  monthlyPnl: [] as {
    month: string;
    commissionCents: number;
    marketingCents: number;
    expenseCents: number;
    netProfitCents: number;
  }[],
  vatEnabled: false,
  vatCollectedCents: 0,
};

export type BusinessReportData = typeof EMPTY_REPORT;

/**
 * Shared by both the Reports admin page (server component) and its API
 * route (CSV export) so the numbers can never drift apart — previously
 * each maintained its own copy of this logic independently, which is how
 * a commission-rate fix ended up missed in two of the four places it was
 * hardcoded.
 */
export async function getBusinessReportData(): Promise<BusinessReportData> {
  try {
    const [commissionRate, vatConfig] = await Promise.all([getCommissionRate(), getVatConfig()]);
    const months = lastNMonths(12);

    // All-time totals, matching the existing totalCommissionCents/
    // totalRevenueCents (also unfiltered by date) — the monthly buckets
    // below naturally only surface the last-12-months slice of the same
    // data via the `.has(key)` guard, so totals and monthly rows stay
    // consistent with each other.
    const [paidOrders, topSellerRows, livestockSales, paidInvoices, expenses, vatPayments] = await Promise.all([
      // Order has FORCE ROW LEVEL SECURITY; orderItem.groupBy below filters
      // through a relation into Order too, which is equally subject to it.
      withAdminContext((tx) =>
        tx.order.findMany({
          where: { status: { in: [...PAID_ORDER_STATUSES] } },
          select: { totalCents: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      ),
      withAdminContext((tx) =>
        tx.orderItem.groupBy({
          by: ["productId"],
          where: { order: { status: { in: [...PAID_ORDER_STATUSES] } } },
          _sum: { lineTotalCents: true },
        }),
      ),
      prisma.listing.findMany({
        where: { status: "SOLD" },
        select: { id: true, priceCents: true, seller: { select: { farmName: true } } },
      }),
      prisma.invoice.findMany({
        where: { status: "PAID" },
        select: { amount: true, paidAt: true },
      }),
      // Expense has FORCE ROW LEVEL SECURITY (admin-only, no tenant column —
      // see the RLS migration comment) — must go through withAdminContext.
      withAdminContext((tx) =>
        tx.expense.findMany({
          select: { category: true, amountCents: true, date: true },
        }),
      ),
      // Only rows with vatRateBps set contribute — historical/untracked
      // payments (vatRateBps null) are silently excluded rather than
      // treated as 0% VAT, so nothing changes retroactively when the
      // vat_enabled toggle flips on. Skip the query entirely while VAT is
      // off, since nothing would use the result.
      vatConfig.enabled
        ? prisma.payment.findMany({
            where: { status: "COMPLETE", vatRateBps: { not: null } },
            select: { amount: true, vatRateBps: true, vatInclusive: true },
          })
        : Promise.resolve([]),
    ]);

    // Gross marketplace volume by month (sellers' money passing through,
    // not HerdFlow's own revenue — kept for the existing sales-volume bar
    // chart, separate from the P&L below).
    const salesBuckets = new Map<string, number>(months.map((m) => [m, 0]));
    for (const order of paidOrders) {
      const key = monthKey(new Date(order.createdAt));
      if (salesBuckets.has(key)) {
        salesBuckets.set(key, (salesBuckets.get(key) ?? 0) + order.totalCents);
      }
    }
    const monthlySales = months.map((m) => ({ month: m, totalCents: salesBuckets.get(m) ?? 0 }));

    const livestockCommissionCents = livestockSales.reduce(
      (sum, l) => sum + Math.round(l.priceCents * commissionRate),
      0,
    );

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

    const totalRevenueCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
    const productCommissionCents = Math.round(totalRevenueCents * commissionRate);
    const totalCommissionCents = productCommissionCents + livestockCommissionCents;

    // P&L: HerdFlow's actual income is commission + sponsorship revenue,
    // never the gross order volume above. Invoice.amount is a Decimal Rand
    // column (the admin invoice form is literally labeled "Amount (R)"),
    // unlike every other *Cents figure here — randToCents converts it so
    // this sum isn't silently off by 100x against totalCommissionCents/
    // expensesCents below.
    const marketingRevenueCents = paidInvoices.reduce(
      (sum, i) => sum + randToCents(Number(i.amount)),
      0,
    );
    const expensesCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
    const netProfitCents = totalCommissionCents + marketingRevenueCents - expensesCents;

    // VAT collected is informational only — it's the tax portion of revenue
    // already counted above, not added to or subtracted from net profit.
    const vatCollectedCents = vatPayments.reduce(
      (sum, p) => sum + calculateVatCents(Number(p.amount), p.vatRateBps, p.vatInclusive),
      0,
    );

    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amountCents);
    }
    const expensesByCategory = [...categoryMap.entries()]
      .map(([category, totalCents]) => ({ category, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);

    // Monthly P&L: commission is derived from gross monthly sales at the
    // current rate (an approximation for historical months if the rate
    // changed — the running/period totals above use the true per-order
    // persisted commissionCents where it matters more).
    const marketingBuckets = new Map<string, number>(months.map((m) => [m, 0]));
    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const key = monthKey(new Date(inv.paidAt));
      if (marketingBuckets.has(key)) {
        marketingBuckets.set(key, (marketingBuckets.get(key) ?? 0) + randToCents(Number(inv.amount)));
      }
    }
    const expenseBuckets = new Map<string, number>(months.map((m) => [m, 0]));
    for (const e of expenses) {
      const key = monthKey(new Date(e.date));
      if (expenseBuckets.has(key)) {
        expenseBuckets.set(key, (expenseBuckets.get(key) ?? 0) + e.amountCents);
      }
    }
    const monthlyPnl = months.map((m) => {
      const commissionCents = Math.round((salesBuckets.get(m) ?? 0) * commissionRate);
      const marketingCents = marketingBuckets.get(m) ?? 0;
      const expenseCents = expenseBuckets.get(m) ?? 0;
      return {
        month: m,
        commissionCents,
        marketingCents,
        expenseCents,
        netProfitCents: commissionCents + marketingCents - expenseCents,
      };
    });

    return {
      monthlySales,
      totalRevenueCents,
      totalCommissionCents,
      livestockCommissionCents,
      productCommissionCents,
      topSellers,
      livestockSold: livestockSales.length,
      commissionRate,
      marketingRevenueCents,
      expensesCents,
      netProfitCents,
      expensesByCategory,
      monthlyPnl,
      vatEnabled: vatConfig.enabled,
      vatCollectedCents,
    };
  } catch (err) {
    console.error("getBusinessReportData error:", err);
    return { ...EMPTY_REPORT, commissionRate: await getCommissionRate().catch(() => 0.05) };
  }
}
