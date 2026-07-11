import Link from "next/link";
import { StoreBanner } from "@/components/store-banner";
import { SponsorBanner } from "@/components/ui/SponsorBanner";
import { SponsorCreativeBanner } from "@/components/marketing/SponsorCreativeBanner";
import { ProductGrid } from "@/components/product-grid";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface FilterParams {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

function parseRandToCents(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const params = await searchParams;
  const minPriceCents = parseRandToCents(params.minPrice);
  const maxPriceCents = parseRandToCents(params.maxPrice);

  // Fetch products from database — graceful fallback on DB error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allProducts: any[] = [];
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let dbError = false;

  try {
    [allProducts, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
            ],
          }),
          ...(params.category && { categoryId: params.category }),
          ...(minPriceCents !== undefined && { priceCents: { gte: minPriceCents } }),
          ...(maxPriceCents !== undefined && {
            priceCents: {
              ...(minPriceCents !== undefined ? { gte: minPriceCents } : {}),
              lte: maxPriceCents,
            },
          }),
        },
        include: { seller: { select: { farmName: true } }, category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch {
    dbError = true;
  }

  // Transform to match ProductGrid interface
  const products = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    description: p.description,
    categoryId: p.categoryId,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
    category: p.category ? { name: p.category.name } : undefined,
    status: p.status,
    seller: p.seller ? { farmName: p.seller.farmName } : undefined,
  }));

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Banner */}
        <StoreBanner />

        <div className="flex justify-end">
          <Link
            href="/orders"
            className="text-brand-navy text-sm font-semibold hover:underline"
          >
            My Orders &rarr;
          </Link>
        </div>

        {/* Sponsor Strip */}
        <SponsorBanner />
        <SponsorCreativeBanner placement="SHOP" />

        {dbError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
            <strong>Note:</strong> We&apos;re having trouble connecting to our product database
            right now. Please try again shortly or contact support.
          </div>
        )}

        {/* Filters and Search */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Shop Filters</h2>
          <form method="GET" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Search Products
                </label>
                <input
                  name="search"
                  type="text"
                  placeholder="Search..."
                  defaultValue={params.search || ""}
                  className="focus:ring-brand-navy w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label
                  htmlFor="shop-category"
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  Category
                </label>
                <select
                  id="shop-category"
                  name="category"
                  defaultValue={params.category || ""}
                  className="focus:ring-brand-navy w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Min Price (ZAR)
                </label>
                <input
                  name="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  defaultValue={params.minPrice || ""}
                  className="focus:ring-brand-navy w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Max Price (ZAR)
                </label>
                <input
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="999999"
                  defaultValue={params.maxPrice || ""}
                  className="focus:ring-brand-navy w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-brand-navy mt-4 rounded-lg px-6 py-2 font-semibold text-white transition hover:bg-blue-900"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Products Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {params.search ? "Search Results" : "Shop Products"}
              </h2>
              <p className="mt-1 text-neutral-600">
                Showing {products.length} product{products.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid products={products} />
        </div>

        <section className="from-brand-navy rounded-2xl bg-gradient-to-r to-[#254f8e] p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">
            Inside HerdFlow
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Looking for live auction lots?</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#ecf1f8]">
            Auctions are kept separate from the storefront. You can access them from here when you
            want to bid on verified livestock lots.
          </p>
          <div className="mt-4">
            <a
              href="/auction"
              className="bg-brand-green inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Go to Live Auctions
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
