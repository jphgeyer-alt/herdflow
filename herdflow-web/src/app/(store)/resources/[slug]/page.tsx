import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResourceCheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.digitalProduct.findUnique({ where: { slug } });
  if (!product || !product.isActive) notFound();

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-xl">
          <div className="h-64 bg-[#f5f8fd]">
            {product.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.coverImage} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">📄</div>
            )}
          </div>
          <div className="p-8">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#A07C3A]">
              {product.category}
            </p>
            <h1 className="mb-2 text-2xl font-black text-[#1B3A6B] md:text-3xl">{product.title}</h1>
            <p className="mb-6 text-xl font-bold text-[#2E7D32]">R{Number(product.price).toFixed(2)}</p>
            <p className="mb-8 whitespace-pre-line text-[#38537a]">{product.description}</p>

            <ResourceCheckoutClient slug={product.slug} price={Number(product.price)} />
          </div>
        </div>
      </div>
    </div>
  );
}
