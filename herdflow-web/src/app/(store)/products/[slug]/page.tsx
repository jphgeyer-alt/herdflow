import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./product-detail-client";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function normalizePhoto(photo: string, fallbackLabel: string) {
  if (!photo) {
    return {
      src: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200&h=900&fit=crop",
      alt: fallbackLabel,
    };
  }

  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return { src: photo, alt: fallbackLabel };
  }

  return {
    src: `https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200&h=900&fit=crop&sig=${encodeURIComponent(photo)}`,
    alt: fallbackLabel,
  };
}

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, farmName: true } },
    },
  });
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  return prisma.product.findMany({
    where: {
      categoryId,
      id: { not: currentProductId },
      status: "ACTIVE",
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      photos: true,
      stockOnHand: true,
    },
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  let product: Awaited<ReturnType<typeof getProduct>> = null;
  let relatedProducts: Awaited<ReturnType<typeof getRelatedProducts>> = [];

  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  if (!product || product.status === "ARCHIVED") {
    notFound();
  }

  try {
    relatedProducts = await getRelatedProducts(product.categoryId, product.id);
  } catch {
    // ignore — related products are optional
  }

  const fallbackLabel = `${product.name} product image`;
  const images = (product.photos.length > 0 ? product.photos : [""]).map((photo) =>
    normalizePhoto(photo, fallbackLabel),
  );

  return (
    <main className="space-y-6 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/shop">
          Back to Shop
        </Link>
      </nav>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
          {product.category.name}
          {product.seller?.farmName ? ` • Sold by ${product.seller.farmName}` : ""}
        </p>
      </header>

      <ProductDetailClient
        slug={product.slug}
        name={product.name}
        description={product.description}
        priceLabel={toCurrency(product.priceCents)}
        stockOnHand={product.stockOnHand}
        images={images}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-brand-navy">Related Products</h2>
          <Link className="text-sm font-semibold text-[#38537a]" href="/shop">
            View all
          </Link>
        </div>

        {relatedProducts.length === 0 ? (
          <p className="rounded-xl border border-[#d8e0ec] bg-white p-5 text-sm text-[#5d7497] shadow-sm">
            No related products available right now.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const photo = normalizePhoto(item.photos[0] || "", `${item.name} product image`);
              return (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="overflow-hidden rounded-xl border border-[#d8e0ec] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={photo.alt} className="h-36 w-full object-cover" src={photo.src} />
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-brand-navy">{item.name}</p>
                    <p className="text-sm font-semibold text-brand-gold">{toCurrency(item.priceCents)}</p>
                    <p className="text-xs text-[#5d7497]">
                      {item.stockOnHand > 0 ? `${item.stockOnHand} in stock` : "Out of stock"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
