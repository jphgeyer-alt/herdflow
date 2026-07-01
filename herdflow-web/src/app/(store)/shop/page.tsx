import { StoreBanner } from '@/components/store-banner';
import { ProductGrid } from '@/components/product-grid';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<FilterParams>;
}) {
  const params = await searchParams;
  const minPriceCents = parseRandToCents(params.minPrice);
  const maxPriceCents = parseRandToCents(params.maxPrice);

  // Fetch products from database
  const allProducts = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
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
    include: {
      seller: {
        select: {
          farmName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform to match ProductGrid interface
  const products = allProducts.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    description: p.description,
    categoryId: p.categoryId,
    status: p.status,
    seller: p.seller ? { farmName: p.seller.farmName } : undefined,
  }));

  // Fetch categories for filters
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <StoreBanner />

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-lg font-bold mb-4">Shop Filters</h2>
        <form method="GET" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Search Products
            </label>
            <input
              name="search"
              type="text"
              placeholder="Search..."
              defaultValue={params.search || ''}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="shop-category" className="block text-sm font-medium text-neutral-700 mb-2">
              Category
            </label>
            <select 
              id="shop-category"
              name="category"
              defaultValue={params.category || ''}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Min Price (ZAR)
            </label>
            <input
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              defaultValue={params.minPrice || ''}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Max Price (ZAR)
            </label>
            <input
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="999999"
              defaultValue={params.maxPrice || ''}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          </div>
        </div>
        <button type="submit" className="mt-4 px-6 py-2 bg-brand-navy text-white font-semibold rounded-lg hover:bg-blue-900 transition">
          Apply Filters
        </button>
        </form>
      </div>

      {/* Products Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {params.search ? 'Search Results' : 'Shop Products'}
            </h2>
            <p className="text-neutral-600 mt-1">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} />
      </div>

      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">Inside HerdFlow</p>
        <h2 className="mt-2 text-2xl font-semibold">Looking for live auction lots?</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#ecf1f8]">
          Auctions are kept separate from the storefront. You can access them from here when you want to bid on verified livestock lots.
        </p>
        <div className="mt-4">
          <a
            href="/auction"
            className="inline-flex rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Go to Live Auctions
          </a>
        </div>
      </section>
    </div>
  );
}
