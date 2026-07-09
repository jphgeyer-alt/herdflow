import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
  bannerImage: string | null;
  thumbnail: string | null;
};

async function getSessions(): Promise<Session[]> {
  try {
    const rows = await prisma.auctionSession.findMany({
      where: { status: { in: ["UPCOMING", "LIVE"] } },
      orderBy: { scheduledAt: "asc" },
      include: {
        lots: {
          select: { currentBidCents: true },
        },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      status: s.status as Session["status"],
      scheduledAt: s.scheduledAt.toISOString(),
      lotCount: s.lots.length,
      topBidCents: s.lots.reduce((max, l) => Math.max(max, l.currentBidCents ?? 0), 0),
      bannerImage: s.bannerImage ?? null,
      thumbnail: s.thumbnail ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function AuctionPage() {
  const sessions = await getSessions();
  const liveSessions = sessions.filter((s) => s.status === "LIVE");
  const upcomingSessions = sessions.filter((s) => s.status === "UPCOMING");

  return (
    <main className="space-y-0 pb-16">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[420px] items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80"
          alt="Livestock auction"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/90 via-[#1B3A6B]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-4 inline-block rounded-full border border-[#d9c08f]/30 bg-[#d9c08f]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#d9c08f]">
            HerdFlow Live Auctions
          </p>
          <h1 className="max-w-2xl text-4xl font-black uppercase leading-tight text-white sm:text-5xl">
            Live Livestock Auctions
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#ecf1f8]">
            Bid on quality livestock from verified South African sellers. Real-time bidding,
            transparent pricing, professional auction management.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#upcoming"
              className="rounded-lg bg-[#2E7D32] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-[#1d5e20]"
            >
              View Upcoming Auctions
            </Link>
            <Link
              href="/auction/results"
              className="rounded-lg border-2 border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-white"
            >
              Past Results
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE NOW ─────────────────────────────────────────────────────── */}
      {liveSessions.length > 0 && (
        <section className="bg-green-600 px-4 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-white">
                <span className="h-3 w-3 animate-pulse rounded-full bg-white" /> LIVE NOW
              </span>
              <span className="text-sm text-white/80">{liveSessions[0].title}</span>
              <span className="text-xs text-white/60">{liveSessions[0].lotCount} lots</span>
            </div>
            <Link
              href={`/auction/live/${liveSessions[0].slug}`}
              className="rounded-lg bg-white px-6 py-2 text-sm font-bold text-green-700 shadow-md transition hover:bg-green-50"
            >
              Join Live Auction →
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto mt-10 max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* ── UPCOMING AUCTIONS ──────────────────────────────────────────── */}
        <section id="upcoming">
          <h2 className="mb-5 text-2xl font-black uppercase text-[#1B3A6B]">
            {upcomingSessions.length > 0 ? "Upcoming Auctions" : "All Auctions"}
          </h2>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-[#d8e0ec] bg-white p-8 text-center shadow-sm">
              <p className="text-[#5d7497]">No upcoming or live auctions at the moment.</p>
              <p className="mt-1 text-sm text-[#9aabb9]">
                Check back soon or contact us to register your interest.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <article
                  key={s.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-[#d8e0ec] bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Banner image */}
                  <div className="relative h-32 overflow-hidden bg-gradient-to-r from-[#1B3A6B] to-[#254f8e]">
                    {s.bannerImage || s.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(s.bannerImage || s.thumbnail)!}
                        alt={s.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl font-black uppercase text-[#d9c08f]/20">
                          {s.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status]}`}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-[#1B3A6B]">{s.title}</h2>
                    </div>
                    <p className="text-xs text-[#5d7497]">{fmtDate(s.scheduledAt)}</p>
                    <p className="text-sm text-[#38537a]">
                      {s.lotCount} lot{s.lotCount !== 1 ? "s" : ""}
                      {s.topBidCents > 0 ? ` · Top bid ${zar(s.topBidCents)}` : ""}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-[#e4ebf5] px-5 py-3">
                    {s.status === "LIVE" ? (
                      <Link
                        href={`/auction/live/${s.slug}`}
                        className="block rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-green-700"
                      >
                        Enter Live Room →
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/auction/live/${s.slug}`}
                          className="block rounded-lg border border-[#cdd8e7] px-4 py-2 text-center text-sm font-semibold text-[#244367] transition hover:border-[#1B3A6B]"
                        >
                          Preview Lots
                        </Link>
                        <Link
                          href={`/auction/register/${s.id}`}
                          className="block rounded-lg bg-[#1B3A6B] px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-[#122844]"
                        >
                          Register to Bid
                        </Link>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-6 text-2xl font-black uppercase text-[#1B3A6B]">How It Works</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                icon: "📋",
                title: "Register",
                desc: "Create your HerdFlow account and complete auction registration. Provide your ID and banking details.",
              },
              {
                step: "2",
                icon: "✅",
                title: "Get Approved",
                desc: "Our team reviews your registration within 24 hours and assigns you a unique bidding number.",
              },
              {
                step: "3",
                icon: "🎯",
                title: "Bid Live",
                desc: "Join the live auction room. Watch the stream and place bids in real time against other buyers.",
              },
              {
                step: "4",
                icon: "🏆",
                title: "Win & Pay",
                desc: "If you win a lot you will receive an invoice. Payment due within 48 hours. We assist with transport.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-[#e4ebf5] bg-white p-5 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3A6B] text-sm font-black text-white">
                  {item.step}
                </div>
                <div className="mb-2 text-3xl">{item.icon}</div>
                <h3 className="mb-1 font-black text-[#1B3A6B]">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[#5d7497]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── RESULTS LINK ──────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-[#1B3A6B] p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-black">Past Auction Results</h2>
          <p className="mb-5 text-sm text-white/70">
            Browse completed auctions and see what lots sold for.
          </p>
          <Link
            href="/auction/results"
            className="inline-flex rounded-lg bg-[#2E7D32] px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#1d5e20]"
          >
            View All Results →
          </Link>
        </section>
      </div>
    </main>
  );
}
