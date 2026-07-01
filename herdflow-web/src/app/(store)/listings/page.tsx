import Link from "next/link";
import { listingData } from "@/lib/marketplace-data";

type ListingsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
  }>;
};

const categoryOptions = [
  "Cattle",
  "Sheep",
  "Goats",
  "Pigs",
  "Farm Products",
  "Equipment",
] as const;

const regionOptions = ["All Regions", "North West", "Free State", "Limpopo", "Gauteng", "Mpumalanga", "Northern Cape"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const selectedCategory = params.category || "All Categories";
  const selectedRegion = params.region || "All Regions";

  const filtered = listingData.filter((item) => {
    const matchesSearch = !q
      ? true
      : [item.title, item.seller, item.category, item.region, item.breed || ""].some((entry) =>
          normalize(entry).includes(normalize(q)),
        );

    const matchesCategory = selectedCategory === "All Categories" ? true : item.category === selectedCategory;
    const matchesRegion = selectedRegion === "All Regions" ? true : item.region === selectedRegion;

    return matchesSearch && matchesCategory && matchesRegion;
  });

  return (
    <main className="space-y-5 pb-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-navy">Livestock and Product Listings</h1>
        <p className="text-sm text-[#38537a] sm:text-base">
          Filter by category and region, or search by listing name, seller, or breed.
        </p>
      </header>

      <section className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="GET">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-navy" htmlFor="q">
              Search
            </label>
            <input
              className="w-full rounded-lg border border-[#c8d3e5] px-3 py-2 text-sm text-[#13263f]"
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search listings, seller, breed..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-navy" htmlFor="category">
              Category
            </label>
            <select
              className="w-full rounded-lg border border-[#c8d3e5] px-3 py-2 text-sm text-[#13263f]"
              id="category"
              name="category"
              defaultValue={selectedCategory}
            >
              <option>All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-navy" htmlFor="region">
              Region
            </label>
            <select
              className="w-full rounded-lg border border-[#c8d3e5] px-3 py-2 text-sm text-[#13263f]"
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

          <button className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white" type="submit">
            Apply Filters
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <p className="text-sm text-[#38537a]">{filtered.length} listing(s) found</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.slug} className="rounded-xl border border-[#d8e0ec] bg-white p-4 shadow-sm">
              <div
                className={
                  item.kind === "Livestock"
                    ? "h-28 rounded-md bg-[linear-gradient(180deg,#e8eef9,#dce6f6)]"
                    : "h-28 rounded-md bg-[linear-gradient(180deg,#f8f4ea,#f0e5cd)]"
                }
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-brand-navy">{item.title}</h2>
                <span className="rounded-full bg-[#eef3fb] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-navy">
                  {item.kind}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#38537a]">
                {item.category} • {item.region}
              </p>
              {item.kind === "Livestock" && (
                <p className="mt-1 text-sm text-[#38537a]">
                  {item.breed} • {item.weight}
                </p>
              )}
              <p className="mt-2 text-lg font-semibold text-brand-gold">{item.price}</p>
              <p className="mt-1 text-sm text-[#38537a]">Seller: {item.seller}</p>
              <Link className="mt-3 inline-block text-sm font-semibold text-brand-navy" href={`/listings/${item.slug}`}>
                View Listing
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
