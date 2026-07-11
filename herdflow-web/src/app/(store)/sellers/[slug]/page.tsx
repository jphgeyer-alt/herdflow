// WEBSITE — herdflow-web/src/app/(store)/sellers/[slug]/page.tsx
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/product-grid";

export const dynamic = "force-dynamic";

export default async function SellerStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const seller = await prisma.seller.findUnique({
    where: { slug },
    select: {
      id: true,
      farmName: true,
      region: true,
      status: true,
      storeDescription: true,
      storeLogoUrl: true,
    },
  });

  if (!seller || seller.status !== "APPROVED") notFound();

  const rawProducts = await prisma.product.findMany({
    where: { sellerId: seller.id, status: "ACTIVE" },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    description: p.description,
    categoryId: p.categoryId,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
    category: p.category ? { name: p.category.name } : undefined,
    status: p.status,
    seller: { farmName: seller.farmName },
  }));

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-[#1B3A6B] px-4 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-6">
          {seller.storeLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.storeLogoUrl}
              alt={seller.farmName}
              className="h-20 w-20 shrink-0 rounded-full border-2 border-white/30 object-cover"
            />
          )}
          <div>
            <h1 className="mb-2 text-4xl font-black">{seller.farmName}</h1>
            <p className="flex items-center gap-1.5 text-white/80">
              <MapPin size={16} />
              {seller.region}
            </p>
            {seller.storeDescription && (
              <p className="mt-2 max-w-2xl text-sm text-white/70">{seller.storeDescription}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Products</h2>
          <p className="mt-1 text-neutral-600">
            {products.length} product{products.length !== 1 ? "s" : ""} from {seller.farmName}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center text-[#5d7497]">
            This seller has no active products right now.
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
