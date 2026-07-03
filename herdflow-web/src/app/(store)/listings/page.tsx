import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HerdflowTrusted } from "@/components/ui/HerdflowTrusted";
import { SafeImg } from "@/components/safe-img";
import { SponsorBanner } from "@/components/ui/SponsorBanner";

export const dynamic = "force-dynamic";

type ListingsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
  }>;
};

const regionOptions = ["All Regions", "North West", "Free State", "Limpopo", "Gauteng", "Mpumalanga", "Northern Cape"];

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const selectedCategory = params.category || "All Categories";
  const selectedRegion = params.region || "All Regions";

  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = [];
  let dbError = false;

  try {
    categories = await prisma.category.findMany({
      where: { kind: { in: ["LIVESTOCK", "BOTH"] } },
      orderBy: { name: "asc" },
    });

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (selectedCategory && selectedCategory !== "All Categories") {
      const category = categories.find((c) => c.name === selectedCategory);
      if (category) where.categoryId = category.id;
    }
    if (selectedRegion && selectedRegion !== "All Regions") {
      where.region = selectedRegion;
    }

    listings = await prisma.listing.findMany({
      where,
      include: {
        seller: { include: { user: true } },
        category: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    if (q) {
      listings = listings.filter((listing) => {
        const searchableText = [
          listing.title,
          listing.breed,
          listing.seller.farmName,
          listing.seller.user.fullName,
          listing.category.name,
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(q);
      });
    }
  } catch {
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] pb-12">
      {/* Hero Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black mb-2">Livestock Listings</h1>
          <p className="text-lg text-white/80">Browse quality livestock from verified farmers across South Africa</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 space-y-8">

        {dbError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
            <strong>Note:</strong> We&apos;re having trouble connecting to the listings database right now. Please try again shortly.
          </div>
        )}

        {/* Filters */}
        <section className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-6">
          <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" method="GET">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-[#244367] mb-2" htmlFor="q">
                Search
              </label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d7497]" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                  id="q"
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder="Search by breed, seller, or title..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2" htmlFor="category">
                Category
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                id="category"
                name="category"
                defaultValue={selectedCategory}
              >
                <option>All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#244367] mb-2" htmlFor="region">
                Region
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-[#cdd8e7] focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20"
                id="region"
                name="region"
                defaultValue={selectedRegion}
              >
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="md:col-span-2 lg:col-span-4 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold uppercase tracking-wide py-3 rounded-lg shadow-lg transition"
              type="submit"
            >
              Apply Filters
            </button>
          </form>
        </section>

        {/* Results Count */}
        <SponsorBanner />
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5d7497]">
            <span className="font-bold text-[#244367]">{listings.length}</span> listing(s) found
          </p>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] p-12 text-center">
            <p className="text-[#5d7497] text-lg mb-4">No listings found matching your criteria.</p>
            <Link
              href="/listings"
              className="inline-block px-8 py-3 bg-[#1B3A6B] hover:bg-[#122844] text-white font-bold rounded-lg transition"
            >
              Clear Filters
            </Link>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <article key={listing.id} className="bg-white rounded-2xl shadow-lg border border-[#e4ebf5] overflow-hidden hover:shadow-xl transition group">
                {listing.photos.length > 0 ? (
                  <SafeImg
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#e8eef9] to-[#dce6f6] flex flex-col items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#9aabb9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[#5d7497] text-xs">No photo</span>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-[#1B3A6B] line-clamp-2">{listing.title}</h2>
                    {listing.isFeatured && (
                      <span className="px-2 py-1 bg-[#A07C3A] text-white text-[10px] font-bold uppercase rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#5d7497]">
                    {listing.category.name} • {listing.region}
                  </p>

                  <div className="flex items-center gap-3 text-sm text-[#5d7497]">
                    <span className="font-semibold">Breed:</span> {listing.breed}
                  </div>

                  {listing.weightKg && (
                    <div className="flex items-center gap-3 text-sm text-[#5d7497]">
                      <span className="font-semibold">Weight:</span> {listing.weightKg}kg
                    </div>
                  )}

                  {listing.ageMonths && (
                    <div className="flex items-center gap-3 text-sm text-[#5d7497]">
                      <span className="font-semibold">Age:</span> {Math.floor(listing.ageMonths / 12)} years {listing.ageMonths % 12} months
                    </div>
                  )}

                  <div className="pt-2">
                    <HerdflowTrusted compact />
                  </div>

                  <p className="text-2xl font-black text-[#2E7D32]">R{(listing.priceCents / 100).toLocaleString()}</p>

                  <p className="text-sm text-[#5d7497]">
                    Seller: <span className="font-semibold text-[#244367]">{listing.seller.farmName || listing.seller.user.fullName}</span>
                  </p>

                  <Link
                    href={`/listings/${listing.slug}`}
                    className="block w-full text-center bg-[#1B3A6B] hover:bg-[#122844] text-white font-bold py-3 rounded-lg transition"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
