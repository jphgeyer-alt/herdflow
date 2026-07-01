import Link from "next/link";

export default function StoreHomePage() {
  const featuredLivestock = [
    { title: "Bonsmara Heifers", region: "North West", price: "R 18,500" },
    { title: "Dorper Ewes", region: "Free State", price: "R 2,800" },
    { title: "Boer Goat Breeding Pair", region: "Limpopo", price: "R 6,900" },
  ];

  const featuredProducts = [
    { title: "Premium Cattle Feed 50kg", region: "North West", price: "R 465" },
    { title: "Solar Trough Pump", region: "Gauteng", price: "R 2,990" },
    { title: "Tagging Kit", region: "Mpumalanga", price: "R 780" },
  ];

  return (
    <main className="space-y-8 pb-10">
      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">Geyer Holdings</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">HerdFlow Marketplace</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#ecf1f8] sm:text-base">
          Buy trusted livestock and farm supplies from verified South African sellers. Fast on mobile, simple to use, and built for rural connectivity.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-[#1a1f2b]" href="/listings">
            Browse Listings
          </Link>
          <Link className="rounded-lg border border-[#95afd5] px-4 py-2 text-sm font-semibold text-white" href="/about">
            About HerdFlow
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-navy">Featured Livestock</h2>
          <Link className="text-sm font-semibold text-brand-gold" href="/listings?category=Cattle">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLivestock.map((item) => (
            <article key={item.title} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
              <div className="h-28 rounded-md bg-[linear-gradient(180deg,#eef3fb,#e3ebf8)]" />
              <h3 className="mt-3 text-base font-semibold text-brand-navy">{item.title}</h3>
              <p className="mt-1 text-sm text-[#38537a]">{item.region}</p>
              <p className="mt-2 text-lg font-semibold text-brand-gold">{item.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-navy">Featured Products</h2>
          <Link className="text-sm font-semibold text-brand-gold" href="/listings?category=Equipment">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((item) => (
            <article key={item.title} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
              <div className="h-28 rounded-md bg-[linear-gradient(180deg,#f9f6ef,#f2ead9)]" />
              <h3 className="mt-3 text-base font-semibold text-brand-navy">{item.title}</h3>
              <p className="mt-1 text-sm text-[#38537a]">{item.region}</p>
              <p className="mt-2 text-lg font-semibold text-brand-gold">{item.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm" href="/register/seller">
          <h3 className="text-lg font-semibold text-brand-navy">Become a Seller</h3>
          <p className="mt-2 text-sm text-[#38537a]">Register your farm and start listing verified livestock and products.</p>
        </Link>
        <Link className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm" href="/register/logistics">
          <h3 className="text-lg font-semibold text-brand-navy">Register as Logistics Partner</h3>
          <p className="mt-2 text-sm text-[#38537a]">Join HerdFlow transport network and serve regional delivery routes.</p>
        </Link>
      </section>
    </main>
  );
}
