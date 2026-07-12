import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AffiliatePartnersRow } from "@/components/marketing/AffiliatePartnersRow";

export const metadata: Metadata = {
  title: "Resources | HerdFlow",
  description: "Templates, record books, contracts, and guides for South African farmers.",
};

export const revalidate = 3600;

export default async function ResourcesPage() {
  const products = await prisma.digitalProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <div className="bg-linear-to-br from-[#1B3A6B] to-[#122844] px-4 py-16 text-center text-white md:px-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#A07C3A]">
          Resources
        </p>
        <h1 className="mb-4 text-3xl font-black sm:text-5xl">Templates &amp; Guides</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
          Ready-to-use record books, contracts, and guides — instant download.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[1fr_280px]">
        <div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white p-12 text-center text-[#5d7497]">
              No resources available yet.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="mb-12">
                <h2 className="mb-6 text-xl font-black text-[#1B3A6B]">{cat}</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {products
                    .filter((p) => p.category === cat)
                    .map((p) => (
                      <Link
                        key={p.id}
                        href={`/resources/${p.slug}`}
                        className="group overflow-hidden rounded-2xl border border-[#e4ebf5] bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        <div className="h-40 bg-[#f5f8fd]">
                          {p.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl">📄</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="mb-1 font-black text-[#1B3A6B] group-hover:underline">{p.title}</h3>
                          <p className="mb-2 line-clamp-2 text-sm text-[#5d7497]">{p.description}</p>
                          <span className="text-sm font-bold text-[#A07C3A]">
                            R{Number(p.price).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <AffiliatePartnersRow placement="RESOURCES_PAGE" />
        </aside>
      </div>
    </div>
  );
}
