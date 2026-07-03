import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
}

async function getCompletedAuctions() {
  try {
    const sessions = await prisma.auctionSession.findMany({
      where: { status: "CLOSED" },
      orderBy: { closedAt: "desc" },
      include: { results: true },
    });
    return sessions.map((s) => {
      const sold = s.results.filter((r) => r.lotStatus === "SOLD");
      const totalValue = sold.reduce((sum, r) => sum + (r.winningBid ?? 0), 0);
      const clearance = s.results.length > 0 ? Math.round((sold.length / s.results.length) * 100) : 0;
      return { id: s.id, title: s.title, scheduledAt: s.scheduledAt, closedAt: s.closedAt, totalLots: s.results.length, soldLots: sold.length, totalValue, clearance };
    });
  } catch {
    return [];
  }
}

export default async function AuctionResultsPage() {
  const auctions = await getCompletedAuctions();

  return (
    <div className="min-h-screen bg-[#f5f4ef] py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link href="/auction" className="text-sm text-[#2E7D32] hover:underline">← Back to Auctions</Link>
          <h1 className="mt-2 text-4xl font-black text-[#1B3A6B] uppercase">Auction Results</h1>
          <p className="text-[#5d7497] mt-1">Browse past HerdFlow auction results</p>
        </div>

        {auctions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e4ebf5] shadow-sm p-12 text-center">
            <p className="text-lg font-bold text-[#1B3A6B]">No completed auctions yet</p>
            <p className="text-sm text-[#5d7497] mt-1">Results will appear here after auctions are completed.</p>
            <Link href="/auction" className="mt-4 inline-block px-6 py-2 bg-[#1B3A6B] text-white text-sm font-bold rounded-lg">View Upcoming Auctions</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e4ebf5] shadow-sm p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#1B3A6B]">{a.title}</h2>
                    <p className="text-sm text-[#5d7497] mt-0.5">{a.closedAt ? fmtDate(a.closedAt) : fmtDate(a.scheduledAt)}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Completed</span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-[#f5f8fd] rounded-xl p-3">
                    <p className="text-xl font-black text-[#1B3A6B]">{a.totalLots}</p>
                    <p className="text-xs text-[#5d7497]">Lots Offered</p>
                  </div>
                  <div className="bg-[#f5f8fd] rounded-xl p-3">
                    <p className="text-xl font-black text-[#2E7D32]">{a.soldLots}</p>
                    <p className="text-xs text-[#5d7497]">Lots Sold</p>
                  </div>
                  <div className="bg-[#f5f8fd] rounded-xl p-3">
                    <p className="text-xl font-black text-[#A07C3A]">{a.clearance}%</p>
                    <p className="text-xs text-[#5d7497]">Clearance Rate</p>
                  </div>
                  <div className="bg-[#f5f8fd] rounded-xl p-3">
                    <p className="text-lg font-black text-[#1B3A6B]">{zar(a.totalValue)}</p>
                    <p className="text-xs text-[#5d7497]">Total Value</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/auction/results/${a.id}`} className="inline-flex items-center gap-2 px-5 py-2 bg-[#1B3A6B] hover:bg-[#122844] text-white text-sm font-bold rounded-lg transition">
                    View Full Results →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
