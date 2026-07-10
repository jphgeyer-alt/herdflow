import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/admin/Card";
import { Pagination } from "@/components/admin/Pagination";
import { SellersManager } from "./sellers-manager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

async function getSellers(page: number) {
  try {
    const [total, sellers] = await Promise.all([
      prisma.seller.count(),
      prisma.seller.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { fullName: true, email: true } },
          _count: { select: { livestockListings: true, products: true } },
        },
      }),
    ]);

    // Attach product sales totals
    const sellerIds = sellers.map((s) => s.id);
    const orderAggregates = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        product: { sellerId: { in: sellerIds } },
        order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      },
      _sum: { lineTotalCents: true },
    });
    const products = await prisma.product.findMany({
      where: { sellerId: { in: sellerIds } },
      select: { id: true, sellerId: true },
    });
    const productToSeller = new Map(products.map((p) => [p.id, p.sellerId]));
    const sellerSales = new Map<string, number>();
    for (const agg of orderAggregates) {
      const sid = productToSeller.get(agg.productId);
      if (sid) sellerSales.set(sid, (sellerSales.get(sid) ?? 0) + (agg._sum.lineTotalCents ?? 0));
    }

    return {
      sellers: sellers.map((s) => ({ ...s, totalSalesCents: sellerSales.get(s.id) ?? 0 })),
      total,
    };
  } catch {
    return { sellers: [], total: 0 };
  }
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const { sellers, total } = await getSellers(page);

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Manage Sellers</h1>
        <p className="text-sm text-navy-300">
          Review seller registrations, approve or reject applications, and track sales history per
          seller.
        </p>
      </header>

      <Card>
        <CardHeader title="All Sellers" description={`${total} registered sellers`} />
        <SellersManager initialSellers={sellers} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/sellers" />
      </Card>
    </main>
  );
}
