import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/marketplace/commission";

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

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

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format"); // "csv"

  try {
    const COMMISSION_RATE = await getCommissionRate();

    const [paidOrders, topSellerRows, livestockSales] = await Promise.all([
      // All paid orders with items for monthly breakdown
      prisma.order.findMany({
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
        select: { totalCents: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      // Top sellers by total product revenue
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
        },
        _sum: { lineTotalCents: true },
      }),

      // Livestock listing sales (mailto-only, tracked separately as 0 unless orders link)
      prisma.listing.findMany({
        where: { status: "SOLD" },
        select: {
          id: true,
          title: true,
          priceCents: true,
          seller: { select: { farmName: true } },
        },
      }),
    ]);

    // Monthly sales buckets
    const months = lastNMonths(12);
    const buckets = new Map<string, number>(months.map((m) => [m, 0]));
    for (const order of paidOrders) {
      const key = monthKey(new Date(order.createdAt));
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + order.totalCents);
      }
    }
    const monthlySales = months.map((m) => ({ month: m, totalCents: buckets.get(m) ?? 0 }));

    // Livestock commission (5% of priceCents for each SOLD listing)
    const livestockCommissionCents = livestockSales.reduce(
      (sum, l) => sum + Math.round(l.priceCents * COMMISSION_RATE),
      0,
    );

    // Top sellers: resolve product -> seller
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
      const name = product.seller.farmName;
      const existing = sellerRevMap.get(key);
      sellerRevMap.set(key, {
        name,
        totalCents: (existing?.totalCents ?? 0) + (row._sum.lineTotalCents ?? 0),
      });
    }
    const topSellers = [...sellerRevMap.values()]
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 10);

    const totalRevenueCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
    const productCommissionCents = Math.round(totalRevenueCents * COMMISSION_RATE);
    const totalCommissionCents = productCommissionCents + livestockCommissionCents;

    const data = {
      monthlySales,
      totalRevenueCents,
      totalCommissionCents,
      livestockCommissionCents,
      productCommissionCents,
      topSellers,
      livestockSold: livestockSales.length,
    };

    if (format === "csv") {
      const lines = [
        "Month,Total Sales (ZAR),Commission (ZAR)",
        ...monthlySales.map(
          (r) =>
            `${r.month},${(r.totalCents / 100).toFixed(2)},${((r.totalCents * COMMISSION_RATE) / 100).toFixed(2)}`,
        ),
        "",
        "Top Seller,Revenue (ZAR)",
        ...topSellers.map((s) => `${s.name},${(s.totalCents / 100).toFixed(2)}`),
      ];
      return new NextResponse(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="herdflow-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
