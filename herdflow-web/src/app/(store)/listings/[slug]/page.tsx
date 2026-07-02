import { notFound } from "next/navigation";
import Link from "next/link";
import { Truck, Phone, Mail, MapPin, Tag, Weight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HerdflowTrusted } from "@/components/ui/HerdflowTrusted";

export const dynamic = "force-dynamic";

type ListingDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listing: any = null;

  try {
    listing = await prisma.listing.findUnique({
      where: { slug },
      include: {
        seller: {
          include: {
            user: { select: { email: true } },
          },
        },
        category: { select: { name: true } },
      },
    });
  } catch {
    // DB error — show not found
  }

  if (!listing || listing.status === "ARCHIVED") {
    notFound();
  }

  const sellerEmail = listing.seller.user.email;
  const sellerPhone = listing.seller.contactPhone;
  const sellerName = listing.seller.farmName;
  const sellerRegion = listing.seller.region;
  const isTrusted = listing.seller.status === "APPROVED";

  const mainPhoto =
    listing.photos.length > 0 && (listing.photos[0].startsWith("http") || listing.photos[0].startsWith("/"))
      ? listing.photos[0]
      : "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200&h=900&fit=crop";

  return (
    <div className="min-h-screen bg-[#f5f4ef] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#5d7497]">
          <Link href="/listings" className="font-semibold text-[#1B3A6B] hover:underline">
            ← Back to Livestock Listings
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photos */}
          <div className="space-y-3">
            <div
              className="h-80 rounded-2xl border border-[#d8e0ec] bg-cover bg-center shadow-lg"
              style={{ backgroundImage: `url('${mainPhoto}')` }}
            />
            {listing.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {(listing.photos as string[]).slice(1, 5).map((photo: string, index: number) => {
                  const src =
                    photo.startsWith("http") || photo.startsWith("/")
                      ? photo
                      : `https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=300&fit=crop&sig=${index}`;
                  return (
                    <div
                      key={index}
                      className="h-20 rounded-lg border border-[#d8e0ec] bg-cover bg-center"
                      style={{ backgroundImage: `url('${src}')` }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="space-y-4 rounded-2xl border border-[#d8e0ec] bg-white p-6 shadow-lg">
            {/* Category & Region */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#5d7497]">
              <span className="flex items-center gap-1">
                <Tag size={12} /> {listing.category.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {listing.region}
              </span>
            </div>

            <h1 className="text-3xl font-black text-[#1B3A6B]">{listing.title}</h1>

            <p className="text-2xl font-bold text-[#A07C3A]">{toCurrency(listing.priceCents)}</p>

            <p className="text-sm text-[#38537a] leading-relaxed">{listing.description}</p>

            {/* Livestock Details */}
            <div className="rounded-xl bg-[#eef3fb] p-4 text-sm text-[#244367] space-y-2">
              {listing.breed && (
                <p className="flex items-center gap-2">
                  <Tag size={14} className="text-[#1B3A6B]" />
                  <span className="font-semibold">Breed:</span> {listing.breed}
                </p>
              )}
              {listing.weightKg && (
                <p className="flex items-center gap-2">
                  <Weight size={14} className="text-[#1B3A6B]" />
                  <span className="font-semibold">Weight:</span> {listing.weightKg} kg
                </p>
              )}
              {listing.ageMonths && (
                <p>
                  <span className="font-semibold">Age:</span>{" "}
                  {listing.ageMonths >= 12
                    ? `${Math.floor(listing.ageMonths / 12)} year${Math.floor(listing.ageMonths / 12) !== 1 ? "s" : ""}`
                    : `${listing.ageMonths} month${listing.ageMonths !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {/* Seller Info */}
            <div className="rounded-xl border border-[#d8e0ec] p-4 text-sm text-[#244367] space-y-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-bold text-[#1B3A6B]">{sellerName}</p>
                {isTrusted && <HerdflowTrusted compact />}
              </div>
              <p className="text-xs text-[#5d7497]">{sellerRegion}</p>
              <p className="flex items-center gap-2">
                <Phone size={13} className="text-[#1B3A6B]" />
                {sellerPhone}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={13} className="text-[#1B3A6B]" />
                {sellerEmail}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`mailto:${sellerEmail}?subject=Enquiry%20about%20${encodeURIComponent(listing.title)}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B3A6B] hover:bg-[#16305a] px-5 py-3 text-sm font-bold text-white transition"
              >
                <Mail size={16} />
                Contact Seller
              </a>
              <Link
                href={`/contact?subject=transport&listing=${encodeURIComponent(listing.title)}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white px-5 py-3 text-sm font-bold transition"
              >
                <Truck size={16} />
                Arrange Transport
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
