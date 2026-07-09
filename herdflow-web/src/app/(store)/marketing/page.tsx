import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRand } from "@/lib/marketing/format";

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

// Presentation only — pricing/features/badge text now come from the
// MarketingPackage table (admin-editable at /admin/marketing/packages).
// This map keys the card's visual style to the known tier slugs, with a
// sane fallback for any future custom package.
const STYLE_BY_SLUG: Record<
  string,
  {
    border: string;
    badgeBg: string;
    cardBg: string;
    headingColor: string;
    btnStyle: string;
  }
> = {
  starter: {
    border: "border-[#A07C3A]",
    badgeBg: "",
    cardBg: "bg-white",
    headingColor: "text-[#A07C3A]",
    btnStyle: "bg-[#1B3A6B] hover:bg-[#122844] text-white",
  },
  growth: {
    border: "border-[#2E7D32]",
    badgeBg: "bg-[#2E7D32]",
    cardBg: "bg-white ring-2 ring-[#2E7D32]",
    headingColor: "text-[#2E7D32]",
    btnStyle: "bg-[#2E7D32] hover:bg-[#1d5e20] text-white",
  },
  premium: {
    border: "border-[#1B3A6B]",
    badgeBg: "",
    cardBg: "bg-[#1B3A6B]",
    headingColor: "text-[#A07C3A]",
    btnStyle: "bg-[#A07C3A] hover:bg-[#8a6830] text-white",
  },
  enterprise: {
    border: "border-[#1B3A6B]",
    badgeBg: "",
    cardBg: "bg-white",
    headingColor: "text-[#1B3A6B]",
    btnStyle: "border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white",
  },
};

const DEFAULT_STYLE = STYLE_BY_SLUG.starter;

async function getPackages() {
  try {
    const packages = await prisma.marketingPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return packages.map((pkg) => {
      const style = STYLE_BY_SLUG[pkg.slug] || DEFAULT_STYLE;
      return {
        id: pkg.slug,
        name: pkg.name.toUpperCase(),
        price: pkg.isCustom ? "Custom" : formatRand(pkg.monthlyFee.toString()),
        period: pkg.isCustom ? "pricing" : "per month",
        badge: pkg.badge,
        features: pkg.features,
        isCustom: pkg.isCustom,
        ...style,
      };
    });
  } catch {
    return [];
  }
}

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
  const PACKAGES = await getPackages();

  return (
    <div className="bg-white">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden">
        {/* Background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80"
          alt="Marketing hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/90 via-[#1B3A6B]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full border border-[#A07C3A]/40 bg-[#A07C3A]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#d4a84b]">
              HerdFlow Marketing
            </span>
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl">
              Reach South Africa&apos;s
              <br />
              <span className="text-[#2E7D32]">Farming Community</span>
            </h1>
            <p className="mt-2 text-lg font-semibold uppercase tracking-wide text-[#A07C3A]">
              Advertise Your Brand Where Farmers Shop
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">
              HerdFlow connects your business directly with thousands of active farmers, livestock
              traders and agricultural buyers across South Africa. Become a HerdFlow Sponsor and put
              your brand in front of the right audience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/marketing/register"
                className="rounded-lg bg-[#2E7D32] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
              >
                Become a Sponsor
              </Link>
              <a
                href="#packages"
                className="rounded-lg border-2 border-white/40 px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:border-white"
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
          <div className="grid grid-cols-2 gap-6 text-center text-white sm:grid-cols-3 lg:grid-cols-5">
            {[
              { value: "10 000+", label: "Active Farmers Reached" },
              { value: "250 000+", label: "Monthly Platform Views" },
              { value: "50+", label: "Registered Agricultural Businesses" },
              { value: "5", label: "Provinces Covered and Growing" },
              { value: "R2.5M+", label: "Livestock Traded Monthly" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-[#A07C3A] sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────── */}
      <section id="packages" className="bg-[#f5f4ef] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#1B3A6B] sm:text-4xl">
              Choose Your Marketing Package
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#5d7497]">
              All packages include the HerdFlow Trusted Sponsor badge and access to our farmer
              network.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border-2 ${pkg.border} ${pkg.cardBg} overflow-hidden shadow-lg`}
              >
                {pkg.badge && (
                  <div
                    className={`${pkg.badgeBg} py-1 text-center text-xs font-bold uppercase tracking-widest text-white`}
                  >
                    {pkg.badge}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3
                    className={`text-xl font-black ${pkg.headingColor} ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-[#A07C3A]" : ""}`}
                  >
                    {pkg.name}
                  </h3>
                  <div className="mb-4 mt-2">
                    <span
                      className={`text-3xl font-black ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white" : "text-[#1B3A6B]"}`}
                    >
                      {pkg.price}
                    </span>
                    <span
                      className={`ml-1 text-sm ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white/60" : "text-[#5d7497]"}`}
                    >
                      {pkg.period}
                    </span>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {pkg.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2 text-sm ${pkg.cardBg === "bg-[#1B3A6B]" ? "text-white/80" : "text-[#5d7497]"}`}
                      >
                        <span className="mt-0.5 shrink-0 text-[#2E7D32]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={
                      pkg.isCustom
                        ? "/contact?subject=enterprise-sponsorship"
                        : `/marketing/register?package=${pkg.id}`
                    }
                    className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-bold uppercase tracking-wide transition ${pkg.btnStyle}`}
                  >
                    {pkg.isCustom ? "Contact Us" : "Get Started"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ADVERTISE ─────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-black uppercase text-[#1B3A6B]">
            Why Advertise With HerdFlow?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <div
                key={b.title}
                className="rounded-2xl border border-[#e4ebf5] bg-[#f5f8fd] p-6 text-center"
              >
                <div className="mb-3 text-4xl">{b.icon}</div>
                <h3 className="mb-2 text-base font-bold uppercase text-[#1B3A6B]">{b.title}</h3>
                <p className="text-sm leading-relaxed text-[#5d7497]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURRENT SPONSORS ──────────────────────────────────── */}
      <section className="bg-[#f5f4ef] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-center text-2xl font-black uppercase text-[#1B3A6B]">
            Our Trusted Sponsors
          </h2>
          <p className="mb-10 text-center text-sm text-[#5d7497]">
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
                  className="flex h-20 w-40 items-center justify-center rounded-xl border border-[#cdd8e7] bg-white shadow-sm transition hover:shadow-md"
                >
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logoUrl}
                      alt={s.companyName}
                      className="max-h-12 max-w-full object-contain"
                    />
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
                  className="flex h-20 w-40 items-center justify-center rounded-xl border-2 border-dashed border-[#cdd8e7] bg-white"
                >
                  <span className="text-xs font-medium text-[#9aabb9]">Your Logo Here</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-8 text-center">
            <Link href="/marketing/register" className="font-bold text-[#2E7D32] hover:underline">
              Become a Sponsor →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-black uppercase text-[#1B3A6B]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group overflow-hidden rounded-xl border border-[#e4ebf5] bg-[#f5f8fd]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-[#1B3A6B]">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-[#2E7D32] transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-[#5d7497]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────── */}
      <section className="bg-[#1B3A6B] py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-black uppercase leading-tight sm:text-4xl">
            Ready to Reach
            <br />
            South Africa&apos;s Farmers?
          </h2>
          <p className="mt-4 text-white/70">Join HerdFlow as a Sponsor Today</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#packages"
              className="rounded-lg bg-[#2E7D32] px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:bg-[#1d5e20]"
            >
              View Packages
            </a>
            <Link
              href="/contact"
              className="rounded-lg border-2 border-white/40 px-8 py-3 font-bold uppercase tracking-wide text-white transition hover:border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
