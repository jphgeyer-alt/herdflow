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
    <main className="pb-16 space-y-0">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[420px] flex items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80"
          alt="Livestock auction"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A6B]/90 via-[#1B3A6B]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <p className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#d9c08f]/20 text-[#d9c08f] border border-[#d9c08f]/30 mb-4">HerdFlow Live Auctions</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase leading-tight max-w-2xl">
            Live Livestock Auctions
          </h1>
          <p className="mt-3 text-[#ecf1f8] text-base max-w-xl leading-relaxed">
            Bid on quality livestock from verified South African sellers. Real-time bidding, transparent pricing, professional auction management.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#upcoming" className="px-6 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white text-sm font-bold rounded-lg uppercase tracking-wide transition shadow-lg">
              View Upcoming Auctions
            </Link>
            <Link href="/auction/results" className="px-6 py-3 border-2 border-white/40 hover:border-white text-white text-sm font-bold rounded-lg uppercase tracking-wide transition">
              Past Results
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE NOW ─────────────────────────────────────────────────────── */}
      {liveSessions.length > 0 && (
        <section className="bg-green-600 py-6 px-4">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-white font-black uppercase tracking-widest text-sm">
                <span className="w-3 h-3 rounded-full bg-white animate-pulse" /> LIVE NOW
              </span>
              <span className="text-white/80 text-sm">{liveSessions[0].title}</span>
              <span className="text-white/60 text-xs">{liveSessions[0].lotCount} lots</span>
            </div>
            <Link href={`/auction/live/${liveSessions[0].slug}`}
              className="px-6 py-2 bg-white text-green-700 font-bold text-sm rounded-lg hover:bg-green-50 transition shadow-md">
              Join Live Auction →
            </Link>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* ── UPCOMING AUCTIONS ──────────────────────────────────────────── */}
        <section id="upcoming">
          <h2 className="text-2xl font-black text-[#1B3A6B] uppercase mb-5">
            {upcomingSessions.length > 0 ? "Upcoming Auctions" : "All Auctions"}
          </h2>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-[#d8e0ec] bg-white p-8 text-center shadow-sm">
              <p className="text-[#5d7497]">No upcoming or live auctions at the moment.</p>
              <p className="mt-1 text-sm text-[#9aabb9]">Check back soon or contact us to register your interest.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <article key={s.id} className="flex flex-col rounded-xl border border-[#d8e0ec] bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-[#1B3A6B] to-[#254f8e] flex items-center justify-center">
                    <span className="text-3xl font-black text-[#d9c08f]/30 uppercase">{s.title.charAt(0)}</span>
                  </div>
                  <div className="flex-1 p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-[#1B3A6B]">{s.title}</h2>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[#5d7497]">{fmtDate(s.scheduledAt)}</p>
                    <p className="text-sm text-[#38537a]">
                      {s.lotCount} lot{s.lotCount !== 1 ? "s" : ""}
                      {s.topBidCents > 0 ? ` · Top bid ${zar(s.topBidCents)}` : ""}
                    </p>
                  </div>
                  <div className="border-t border-[#e4ebf5] px-5 py-3 space-y-2">
                    {s.status === "LIVE" ? (
                      <Link href={`/auction/live/${s.slug}`}
                        className="block rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-center text-sm font-bold text-white transition">
                        Enter Live Room →
                      </Link>
                    ) : (
                      <>
                        <Link href={`/auction/live/${s.slug}`}
                          className="block rounded-lg border border-[#cdd8e7] px-4 py-2 text-center text-sm font-semibold text-[#244367] hover:border-[#1B3A6B] transition">
                          Preview Lots
                        </Link>
                        <Link href={`/auction/register/${s.id}`}
                          className="block rounded-lg bg-[#1B3A6B] hover:bg-[#122844] px-4 py-2 text-center text-sm font-bold text-white transition">
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
          <h2 className="text-2xl font-black text-[#1B3A6B] uppercase mb-6">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: "1", icon: "📋", title: "Register", desc: "Create your HerdFlow account and complete auction registration. Provide your ID and banking details." },
              { step: "2", icon: "✅", title: "Get Approved", desc: "Our team reviews your registration within 24 hours and assigns you a unique bidding number." },
              { step: "3", icon: "🎯", title: "Bid Live", desc: "Join the live auction room. Watch the stream and place bids in real time against other buyers." },
              { step: "4", icon: "🏆", title: "Win & Pay", desc: "If you win a lot you will receive an invoice. Payment due within 48 hours. We assist with transport." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-[#e4ebf5] shadow-sm p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B] text-white text-sm font-black flex items-center justify-center mx-auto mb-3">{item.step}</div>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-black text-[#1B3A6B] mb-1">{item.title}</h3>
                <p className="text-xs text-[#5d7497] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── RESULTS LINK ──────────────────────────────────────────────── */}
        <section className="bg-[#1B3A6B] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-black mb-2">Past Auction Results</h2>
          <p className="text-white/70 text-sm mb-5">Browse completed auctions and see what lots sold for.</p>
          <Link href="/auction/results" className="inline-flex px-8 py-3 bg-[#2E7D32] hover:bg-[#1d5e20] text-white font-bold rounded-lg transition text-sm uppercase tracking-wide">
            View All Results →
          </Link>
        </section>
      </div>
    </main>
  );
}
