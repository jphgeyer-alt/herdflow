import Link from "next/link";

const features = [
  {
    title: "Trusted Products",
    description: "Verified farm goods from approved South African suppliers.",
    href: "/shop",
  },
  {
    title: "Transport Solutions",
    description: "Reliable logistics for moving livestock and farm supplies.",
    href: "/contact",
  },
  {
    title: "Marketing & Ads",
    description: "Promote products, farm brands, and seasonal offers.",
    href: "/contact",
  },
];

const stats = [
  ["10 000+", "Active Farmers"],
  ["250 000+", "Herds Managed"],
  ["5 000+", "Products"],
  ["1 500+", "Auctions Completed"],
];

export default function Home() {
  return (
    <main className="bg-[#f5f4ef] text-[#15263d]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-full border border-[#dce2d4] bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#16263e] to-[#6da63d]" />
            <div className="leading-tight">
              <p className="text-xl font-black tracking-tight text-[#16263e]">HerdFlow</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6da63d]">Smarter Herds. Stronger Futures.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold uppercase tracking-[0.16em] text-[#24364f] lg:flex">
            <Link href="/" className="border-b-2 border-[#6da63d] pb-1 text-[#6da63d]">Home</Link>
            <Link href="/shop" className="hover:text-[#6da63d]">Products</Link>
            <Link href="/about" className="hover:text-[#6da63d]">About Us</Link>
            <Link href="/contact" className="hover:text-[#6da63d]">Contact</Link>
            <Link href="/admin/login" className="rounded-full bg-[#6da63d] px-4 py-2 text-white hover:bg-emerald-700">Login / Sign Up</Link>
          </nav>
        </header>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#dbe3d3] bg-white shadow-[0_20px_60px_rgba(18,35,60,0.12)]">
          <div className="relative min-h-[660px] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(245,244,239,0.94) 0%, rgba(245,244,239,0.8) 34%, rgba(245,244,239,0.12) 100%), url('https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1600&h=900&fit=crop')" }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_35%)]" />
            <div className="relative grid gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-14 lg:py-16">
              <div className="max-w-2xl pt-8">
                <p className="inline-flex rounded-full border border-[#cdd7c5] bg-white/85 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#6da63d] shadow-sm">
                  The all-in-one platform for the agricultural community
                </p>
                <h1 className="mt-7 max-w-xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-[#132238] sm:text-6xl lg:text-7xl">
                  Professional agriculture commerce for South Africa
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[#36485e] sm:text-xl">
                  HerdFlow connects farms, verified products, logistics, and growth tools into one polished marketplace built for real agricultural trade.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/shop" className="rounded-xl bg-[#6da63d] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#6da63d]/25 hover:bg-emerald-700">
                    Get Started
                  </Link>
                  <Link href="/shop" className="rounded-xl border border-[#b8c4b1] bg-white/70 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-[#29415f] hover:border-[#6da63d] hover:text-[#6da63d]">
                    Browse Products
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {features.map((feature) => (
                    <Link key={feature.title} href={feature.href} className="group rounded-2xl border border-[#e2e8da] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                      <div className="mb-4 h-10 w-10 rounded-full bg-[#15263d] text-[#9dcc55]" />
                      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#15263d]">{feature.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#4d627c]">{feature.description}</p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#6da63d]">Learn more →</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-end">
                <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-[#132238]/90 p-7 text-white shadow-2xl backdrop-blur-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9dcc55]">Trusted. Connected. Empowered.</p>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">Premium Products</p>
                      <p className="mt-1 text-2xl font-black">Shop verified farm goods</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">Live Auctions</p>
                      <p className="mt-1 text-2xl font-black">Access from inside the store</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">Transport & Ads</p>
                      <p className="mt-1 text-2xl font-black">Built for growth</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#d8e1d0] bg-[#132238] px-6 py-8 text-white lg:px-14">
              <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
                <div className="grid gap-5 sm:grid-cols-4">
                  {stats.map(([value, label]) => (
                    <div key={label} className="border-r border-white/15 pr-5 last:border-r-0">
                      <p className="text-2xl font-black text-[#9dcc55]">{value}</p>
                      <p className="mt-1 text-sm text-white/80">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black uppercase tracking-tight text-white">One platform.</p>
                  <p className="text-2xl font-black uppercase tracking-tight text-[#9dcc55]">Endless possibilities.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
