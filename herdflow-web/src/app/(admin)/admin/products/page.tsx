import { prisma } from "@/lib/prisma";
import { ListingsManager } from "./listings-manager";

export const dynamic = "force-dynamic";

async function getListingData() {
  try {
    const [initialLivestock, initialProducts, categories, sellers] = await Promise.all([
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          seller: { select: { farmName: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          seller: { select: { farmName: true } },
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.seller.findMany({ orderBy: { farmName: "asc" }, select: { id: true, farmName: true } }),
    ]);

    return { initialLivestock, initialProducts, categories, sellers };
  } catch {
    return { initialLivestock: [], initialProducts: [], categories: [], sellers: [] };
  }
}

export default async function AdminProductsPage() {
  const { initialLivestock, initialProducts, categories, sellers } = await getListingData();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-brand-navy">Manage Listings</h1>
        <p className="text-sm text-[#38537a]">
          Review livestock and products, approve new entries, edit details, delete records, and feature items for the homepage.
        </p>
      </header>

      <ListingsManager
        initialLivestock={initialLivestock}
        initialProducts={initialProducts}
        categories={categories}
        sellers={sellers}
      />
    </main>
  );
}
