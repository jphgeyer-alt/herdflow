import { notFound } from "next/navigation";
import Link from "next/link";
import { listingData } from "@/lib/marketplace-data";
import { HerdflowTrusted } from "@/components/ui/HerdflowTrusted";

type ListingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = listingData.find((entry) => entry.slug === slug);

  if (!listing) {
    notFound();
  }

  const isLivestock = listing.kind === "Livestock";

  return (
    <main className="space-y-5 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/listings">
          Back to Listings
        </Link>
      </nav>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="h-64 rounded-xl border border-[#d8e0ec] bg-[linear-gradient(180deg,#edf3fb,#e3ecf8)]" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {listing.photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="h-16 rounded-md border border-[#d8e0ec] bg-[linear-gradient(180deg,#f8f4ea,#f0e5cd)]"
                aria-label={`Listing photo ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#d8e0ec] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
            {listing.kind} • {listing.category} • {listing.region}
          </p>
          <h1 className="text-3xl font-semibold text-brand-navy">{listing.title}</h1>
          <p className="text-xl font-semibold text-brand-gold">{listing.price}</p>
          <p className="text-sm text-[#38537a]">{listing.description}</p>

          {isLivestock && (
            <div className="rounded-lg bg-[#eef3fb] p-3 text-sm text-[#244367]">
              <p>
                <span className="font-semibold">Breed:</span> {listing.breed}
              </p>
              <p>
                <span className="font-semibold">Weight:</span> {listing.weight}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-[#d8e0ec] p-3 text-sm text-[#244367]">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-brand-navy">Seller Information</p>
              <HerdflowTrusted compact />
            </div>
            <p>{listing.seller}</p>
            <p>{listing.sellerPhone}</p>
            <p>{listing.sellerEmail}</p>
          </div>

          <div className="pt-1">
            {isLivestock ? (
              <a
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                href={`mailto:${listing.sellerEmail}?subject=Enquiry%20about%20${encodeURIComponent(listing.title)}`}
              >
                Contact Seller
              </a>
            ) : (
              <Link
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-[#1d2638] sm:w-auto"
                href={`/cart?add=${encodeURIComponent(listing.slug)}`}
              >
                Add to Cart
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
