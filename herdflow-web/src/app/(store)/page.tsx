import Link from "next/link";

export default function StoreHomePage() {
  return (
    <main className="bg-[#f5f4ef] px-4 py-6 text-[#15263d] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[2rem] border border-[#dbe3d3] bg-white p-6 shadow-[0_20px_60px_rgba(18,35,60,0.12)] lg:p-10">
        <p className="inline-flex rounded-full border border-[#cdd7c5] bg-[#f8fbf2] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#6da63d]">
          The all-in-one platform for the agricultural community
        </p>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-[#132238] sm:text-6xl lg:text-7xl">
              Professional agriculture commerce for South Africa
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#36485e] sm:text-xl">
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
          </div>

          <div className="rounded-[2rem] bg-[#132238]/90 p-7 text-white shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9dcc55]">Trusted. Connected. Empowered.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Premium Products</p>
                <p className="mt-1 text-2xl font-black">Shop verified farm goods</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Transport Solutions</p>
                <p className="mt-1 text-2xl font-black">Reliable logistics support</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Marketing & Ads</p>
                <p className="mt-1 text-2xl font-black">Built for growth</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}