import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SponsorBanner } from "@/components/ui/SponsorBanner";
import { SponsorCreativeBanner } from "@/components/marketing/SponsorCreativeBanner";
import { HomeNav } from "@/components/HomeNav";
import { getPlatformStats } from "@/lib/platform-stats";

// Stats are real counts from the database, not hardcoded — re-fetched at
// most once a day so the homepage stays fast while still growing with the
// business (see src/lib/platform-stats.ts).
export const revalidate = 86400;

const featureCards = [
  {
    title: "HERD MANAGEMENT",
    description: "Manage your herd on the go with powerful tools",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80",
    href: "/shop",
  },
  {
    title: "TRUSTED PRODUCTS",
    description: "Shop quality products from trusted agricultural suppliers",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    href: "/shop",
  },
  {
    title: "TRANSPORT SOLUTIONS",
    description: "Reliable livestock transport services",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80",
    href: "/shop",
  },
  {
    title: "AUCTIONS",
    description: "Buy and sell livestock with confidence at our online auctions",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
    href: "/auction",
  },
  {
    title: "MARKETING & ADVERTISING",
    description: "Advertise your business, products or livestock",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
    href: "/marketing",
  },
];

export default async function Home() {
  const platformStats = await getPlatformStats();

  const stats = [
    { value: platformStats.activeFarmers.toLocaleString(), label: "Active Farmers" },
    { value: platformStats.herdsManaged.toLocaleString(), label: "Herds Managed" },
    { value: platformStats.products.toLocaleString(), label: "Products" },
    { value: platformStats.auctionsCompleted.toLocaleString(), label: "Auctions Completed" },
    { value: platformStats.transportBookings.toLocaleString(), label: "Transport Bookings" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <HomeNav />

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] w-full max-w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80')",
          }}
        />
        {/* TODO: Replace with licensed HerdFlow photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left Side - Text */}
            <div className="space-y-4 text-white md:space-y-6">
              <h1 className="w-full hyphens-auto break-words text-2xl font-black uppercase leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                The all-in-one platform for the agricultural community
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
                HerdFlow brings everything farmers need into one powerful platform. Manage your
                herd, buy trusted products, book transport, bid at auctions and advertise to the
                right audience.
              </p>

              <div className="flex flex-wrap gap-3 pt-2 md:gap-4 md:pt-4">
                <Link
                  href="/shop"
                  className="bg-green hover:bg-green-light inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-xl transition md:px-8 md:py-4 md:text-base"
                >
                  Get Started
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10 md:gap-3 md:px-8 md:py-4 md:text-base"
                >
                  Browse Livestock
                </Link>
              </div>
            </div>

            {/* Right Side - Trust Box */}
            <div className="relative w-full">
              <div className="bg-navy/95 border-gold/30 rounded-3xl border-4 p-6 shadow-2xl backdrop-blur md:p-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green h-6 w-6 flex-shrink-0 md:h-8 md:w-8" />
                    <span className="text-xl font-black uppercase tracking-wide text-white md:text-2xl">
                      Trusted.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green h-6 w-6 flex-shrink-0 md:h-8 md:w-8" />
                    <span className="text-xl font-black uppercase tracking-wide text-white md:text-2xl">
                      Connected.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green h-6 w-6 flex-shrink-0 md:h-8 md:w-8" />
                    <span className="text-xl font-black uppercase tracking-wide text-white md:text-2xl">
                      Empowered.
                    </span>
                  </div>
                  <div className="border-t border-white/20 pt-3 md:pt-4">
                    <p className="text-gold font-serif text-xl italic md:text-2xl">
                      Growing Together.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SponsorCreativeBanner placement="HOMEPAGE" />

      {/* FEATURE CARDS SECTION */}
      <section id="features" className="w-full overflow-hidden bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-5">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] w-full">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${card.image}')` }}
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/50 transition group-hover:bg-black/40" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-base font-black uppercase tracking-wide text-white md:text-xl">
                        {card.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-white/90 md:text-sm">
                        {card.description}
                      </p>
                      <div className="pt-1 md:pt-2">
                        <span className="text-green inline-flex items-center gap-2 text-xs font-bold uppercase md:text-sm">
                          Learn More →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-navy w-full py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[1.5fr_1fr]">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-5">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="border-green mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 md:mb-4 md:h-16 md:w-16">
                    <CheckCircle2 className="text-green h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div className="text-2xl font-black text-white md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-xs text-white/70 md:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Right Text */}
            <div className="space-y-2 text-center lg:text-right">
              <h3 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
                <span className="text-white">One Platform.</span>
                <br />
                <span className="text-green">Endless Possibilities.</span>
              </h3>
              <p className="text-gold-light font-serif text-lg italic md:text-xl">
                Managing Today. Building Tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Banner */}
      <SponsorBanner />

      {/* Facebook Banner */}
      <div className="w-full bg-[#1B3A6B] py-5 text-center">
        <a
          href="https://www.facebook.com/share/1cUWCfQwut/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-sm font-medium text-white transition-colors duration-200 hover:text-[#90c2ff]"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Follow HerdFlow on Facebook — Stay updated with latest listings and auction dates
        </a>
      </div>
    </div>
  );
}
