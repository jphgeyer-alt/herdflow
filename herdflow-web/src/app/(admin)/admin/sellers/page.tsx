import { prisma } from "@/lib/prisma";
import { SellersManager } from "./sellers-manager";

export const dynamic = "force-dynamic";

async function getSellers() {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { livestockListings: true, products: true } },
      },
    });

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

    return sellers.map((s) => ({ ...s, totalSalesCents: sellerSales.get(s.id) ?? 0 }));
  } catch {
    return [];
  }
}

export default async function AdminSellersPage() {
  const sellers = await getSellers();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-brand-navy">Manage Sellers</h1>
        <p className="text-sm text-[#38537a]">
          Review seller registrations, approve or reject applications, and track sales history per seller.
        </p>
      </header>
      <SellersManager initialSellers={sellers} />
    </main>
  );
}
