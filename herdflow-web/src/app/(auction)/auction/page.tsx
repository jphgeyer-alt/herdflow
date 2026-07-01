import Link from "next/link";

export const dynamic = "force-dynamic";

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(cents / 100);
}

function fmtDate(v: Date | string) {
  return new Date(v).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Upcoming",
  LIVE: "Live Now",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  LIVE: "bg-green-100 text-green-800 animate-pulse",
  CLOSED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-700",
};

type Session = {
  id: string;
  title: string;
  slug: string;
  status: "UPCOMING" | "LIVE" | "CLOSED" | "CANCELLED";
  scheduledAt: string;
  lotCount: number;
  topBidCents: number;
};

function getSessions(): Session[] {
  // Compile-safe fallback data until auction Prisma models are added.
  return [
    {
      id: "live-1",
      title: "Prime Cattle Evening Sale",
      slug: "prime-cattle-evening-sale",
      status: "LIVE",
      scheduledAt: new Date().toISOString(),
      lotCount: 18,
      topBidCents: 245000,
    },
    {
      id: "upcoming-1",
      title: "Breeding Stock Showcase",
      slug: "breeding-stock-showcase",
      status: "UPCOMING",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      lotCount: 24,
      topBidCents: 0,
    },
  ];
}

export default async function AuctionPage() {
  const sessions = getSessions();

  return (
    <main className="space-y-6 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/">
          ← Back to Home
        </Link>
      </nav>

      <section className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">HerdFlow</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Live Auctions</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#ecf1f8] sm:text-base">
          Bid on verified livestock lots in real time. Auction inventory is entirely separate from the product
          storefront — what you see here is only for auction.
        </p>
      </section>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-[#d8e0ec] bg-white p-8 text-center shadow-sm">
          <p className="text-[#5d7497]">No upcoming or live auctions at the moment.</p>
          <p className="mt-1 text-sm text-[#9aabb9]">Check back soon or contact us to register your interest.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const topBid = s.topBidCents;
            return (
              <article key={s.id} className="flex flex-col rounded-xl border border-[#d8e0ec] bg-white shadow-sm">
                <div className="flex-1 p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-brand-navy">{s.title}</h2>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#5d7497]">{fmtDate(s.scheduledAt)}</p>
                  <p className="text-sm text-[#38537a]">
                    {s.lotCount} lot{s.lotCount !== 1 ? "s" : ""}
                    {topBid > 0 ? ` · Top bid ${zar(topBid)}` : ""}
                  </p>
                </div>
                <div className="border-t border-[#e4ebf5] px-5 py-3">
                  {s.status === "LIVE" ? (
                    <Link
                      href={`/auction/live/${s.slug}`}
                      className="block rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      Enter Live Room →
                    </Link>
                  ) : (
                    <Link
                      href={`/auction/live/${s.slug}`}
                      className="block rounded-lg border border-[#cdd8e7] px-4 py-2 text-center text-sm font-semibold text-[#244367]"
                    >
                      Preview Lots
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
