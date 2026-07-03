import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getActiveSponsors() {
  try {
    return await prisma.sponsor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { approvedAt: "desc" },
    });
  } catch {
    return [];
  }
}

const PACKAGES = [
  {
    id: "starter",
    name: "STARTER",
    price: "R2,500",
    period: "per month",
    border: "border-[#A07C3A]",
    badge: null,
    badgeBg: "",
    cardBg: "bg-white",
    headingColor: "text-[#A07C3A]",
    btnStyle: "bg-[#1B3A6B] hover:bg-[#122844] text-white",
    features: [
      "Logo on HerdFlow homepage",
      "Listed in Trusted Suppliers directory",
      "1 featured product or service listing",
      "Monthly performance report",
      "HerdFlow Trusted Sponsor badge",
      "Email to farmer database once per month",
    ],
  },
  {
    id: "growth",
    name: "GROWTH",
    price: "R5,500",
    period: "per month",
    border: "border-[#2E7D32]",
    badge: "MOST POPULAR",
    badgeBg: "bg-[#2E7D32]",
    cardBg: "bg-white ring-2 ring-[#2E7D32]",
    headingColor: "text-[#2E7D32]",
    btnStyle: "bg-[#2E7D32] hover:bg-[#1d5e20] text-white",
    features: [
      "Everything in Starter",
      "Banner ads on listings and shop pages",
      "3 featured product or service listings",
      "Social media mention twice per month",
      "Priority search placement",
      "Bi-weekly performance reports",
      "Dedicated account manager contact",
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "R12,000",
    period: "per month",
    border: "border-[#1B3A6B]",
    badge: null,
    badgeBg: "",
    cardBg: "bg-[#1B3A6B]",
    headingColor: "text-[#A07C3A]",
    btnStyle: "bg-[#A07C3A] hover:bg-[#8a6830] text-white",
    features: [
      "Everything in Growth",
      "Homepage hero banner rotation",
      "10 featured listings priority placement",
      "Weekly social media posts about brand",
      "Email campaign to full farmer database",
      "Video or image ads in auction rooms",
      "Weekly detailed analytics report",
      "Co-branded content creation",
      "Early access to new HerdFlow features",
    ],
  },
  {
    id: "enterprise",
    name: "ENTERPRISE",
    price: "Custom",
    period: "pricing",
    border: "border-[#1B3A6B]",
    badge: null,
    badgeBg: "",
    cardBg: "bg-white",
    headingColor: "text-[#1B3A6B]",
    btnStyle: "border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white",
    features: [
      "Custom sponsorship agreement",
      "Exclusive category sponsorship available",
      "Live auction naming rights",
      "Full website takeover options",
      "National and regional targeting",
      "Custom reporting dashboard",
      "Dedicated HerdFlow marketing team",
    ],
  },
];

const FAQS = [
  {
    q: "How does HerdFlow marketing work?",
    a: "Your brand gets featured across our platform including homepage, listing pages, auction rooms and farmer email database. Choose a package and we handle everything.",
  },
  {
    q: "Who will see my advertisements?",
    a: "Registered farmers, livestock buyers and agricultural businesses across South Africa focused specifically on the agricultural sector.",
  },
  {
    q: "Can I cancel my sponsorship?",
    a: "Yes. Starter and Growth are month to month with 30 days notice. No long term contracts.",
  },
  {
    q: "How do I measure results?",
    a: "Monthly reports showing impressions, clicks and engagement. Premium gets weekly reports.",
  },
  {
    q: "What content do I need to provide?",
    a: "Your logo, short description and product images. Our team helps Premium and Enterprise sponsors create content.",
  },
];

export default async function MarketingPage() {
  const sponsors = await getActiveSponsors();

  return (
    <div className="bg-white">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-[520px] flex items-center overflow-hidden">
        {/* Background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80"
          alt="Marketing hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/90 via-[#1B3A6B]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#A07C3A]/20 text-[#d4a84b] border border-[#A07C3A]/40 mb-4">
              HerdFlow Marketing
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight tracking-tight">
              Reach South Africa&apos;s<br />
              <span className="text-[#2E7D32]">Farming Community</span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-[#A07C3A] uppercase tracking-wide">
              Advertise Your Brand Where Farmers Shop
            </p>
            <p className="mt-4 text-white/80 text-base leading-relaxed max-w-lg">
              HerdFlow connects your business directly with thousands of active farmers, livestock
              traders and agricultural buyers across South Africa. Become a HerdFlow Sponsor and
              put your brand in front of the right audience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/marketing/register"
                className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg uppercase tracking-wide transition shadow-lg"
              >
                Become a Sponsor
              </Link>
              <a
                href="#packages"
                className="px-8 py-3 border-2 border-white/40 text-white hover:border-white font-bold rounded-lg uppercase tracking-wide transition"
              >
                View Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────── */}
      <section className="bg-[#1B3A6B] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center text-white">
            {[
              { value: "10 000+", label: "Active Farmers Reached" },
              { value: "250 000+", label: "Monthly Platform Views" },
              { value: "50+", label: "Registered Agricultural Businesses" },
              { value: "5", label: "Provinces Covered and Growing" },
              { value: "R2.5M+", label: "Livestock Traded Monthly" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-black text-[#A07C3A]">{s.value}</p>
                <p className="text-xs text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────── */}
      <section id="packages" className="py-20 bg-[#f5f4ef]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#1B3A6B] uppercase tracking-tight">
              Choose Your Marketing Package
            </h2>
            <p className="mt-3 text-[#5d7497] max-w-xl mx-auto">
              All packages include the HerdFlow Trusted Sponsor badge and access to our farmer network.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border-2 ${pkg.border} ${pkg.cardBg} shadow-lg overflow-hidden`}
              >
                {pkg.badge && (
                  <div className={`${pkg.badgeBg} text-white text-xs font-bold uppercase tracking-widest py-1 text-center`}>
                    {pkg.badge}
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className={`text-xl font-black ${pkg.headingColor} ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-[#A07C3A]" : ""}`}>
                    {pkg.name}
                  </h3>
                  <div className="mt-2 mb-4">
                    <span className={`text-3xl font-black ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white" : "text-[#1B3A6B]"}`}>
                      {pkg.price}
                    </span>
                    <span className={`text-sm ml-1 ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white/60" : "text-[#5d7497]"}`}>
                      {pkg.period}
                    </span>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {pkg.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white/80" : "text-[#5d7497]"}`}>
                        <span className="text-[#2E7D32] mt-0.5 shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pkg.id === "enterprise" ? "/contact?subject=enterprise-sponsorship" : `/marketing/register?package=${pkg.id}`}
                    className={`mt-6 block w-full text-center py-3 px-4 rounded-lg font-bold uppercase tracking-wide text-sm transition ${pkg.btnStyle}`}
                  >
                    {pkg.id === "enterprise" ? "Contact Us" : "Get Started"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ADVERTISE ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-[#1B3A6B] uppercase text-center mb-12">
            Why Advertise With HerdFlow?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🎯",
                title: "Targeted Audience",
                desc: "Reach farmers actively looking for your products — not random internet users.",
              },
              {
                icon: "🤝",
                title: "Trusted Platform",
                desc: "Your brand is associated with a verified and respected agricultural marketplace.",
              },
              {
                icon: "📊",
                title: "Measurable Results",
                desc: "Detailed monthly reports showing exactly how many farmers engaged with your brand.",
              },
              {
                icon: "💰",
                title: "Affordable Reach",
                desc: "Reach thousands of agricultural buyers for a fraction of traditional advertising.",
              },
            ].map((b) => (
              <div key={b.title} className="text-center p-6 rounded-2xl border border-[#e4ebf5] bg-[#f5f8fd]">
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="text-base font-bold text-[#1B3A6B] uppercase mb-2">{b.title}</h3>
                <p className="text-sm text-[#5d7497] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURRENT SPONSORS ──────────────────────────────────── */}
      <section className="py-16 bg-[#f5f4ef]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-[#1B3A6B] uppercase text-center mb-2">
            Our Trusted Sponsors
          </h2>
          <p className="text-center text-[#5d7497] text-sm mb-10">
            Join these forward-thinking businesses reaching South Africa&apos;s farming community.
          </p>
          {sponsors.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {sponsors.map((s) => (
                <a
                  key={s.id}
                  href={s.website || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-40 h-20 bg-white rounded-xl border border-[#cdd8e7] shadow-sm hover:shadow-md transition"
                >
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt={s.companyName} className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-[#5d7497]">{s.companyName}</span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-center w-40 h-20 bg-white rounded-xl border-2 border-dashed border-[#cdd8e7]"
                >
                  <span className="text-xs text-[#9aabb9] font-medium">Your Logo Here</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-center mt-8">
            <Link href="/marketing/register" className="text-[#2E7D32] font-bold hover:underline">
              Become a Sponsor →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-[#1B3A6B] uppercase text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-[#e4ebf5] bg-[#f5f8fd] overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-[#1B3A6B] list-none">
                  {faq.q}
                  <span className="text-[#2E7D32] ml-4 shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-[#5d7497] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section className="bg-[#1B3A6B] py-20 text-white text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl sm:text-4xl font-black uppercase leading-tight">
            Ready to Reach<br />South Africa&apos;s Farmers?
          </h2>
          <p className="mt-4 text-white/70">Join HerdFlow as a Sponsor Today</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#packages"
              className="px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg uppercase tracking-wide transition"
            >
              View Packages
            </a>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-white/40 hover:border-white text-white font-bold rounded-lg uppercase tracking-wide transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
