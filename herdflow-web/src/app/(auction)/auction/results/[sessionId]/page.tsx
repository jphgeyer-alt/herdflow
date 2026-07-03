import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ sessionId: string }> };

function zar(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function AuctionResultDetailPage({ params }: PageProps) {
  const { sessionId } = await params;

  let session: { id: string; title: string; scheduledAt: Date; closedAt: Date | null; description: string } | null = null;
  let results: Array<{
    id: string; lotNumber: number; lotTitle: string; lotStatus: string;
    winningBid: number | null; startPrice: number; reserveMet: boolean; totalBids: number;
    soldAt: Date | null; biddingNumber: string | null;
  }> = [];

  try {
    session = await prisma.auctionSession.findUnique({
      where: { id: sessionId },
      select: { id: true, title: true, scheduledAt: true, closedAt: true, description: true },
    });
    if (!session) notFound();

    results = await prisma.auctionResult.findMany({
      where: { sessionId },
      orderBy: { lotNumber: "asc" },
    });
  } catch {
    notFound();
  }

  if (!session) notFound();

  const sold = results.filter((r) => r.lotStatus === "SOLD");
  const totalValue = sold.reduce((sum, r) => sum + (r.winningBid ?? 0), 0);
  const clearance = results.length > 0 ? Math.round((sold.length / results.length) * 100) : 0;
  const avgPrice = sold.length > 0 ? Math.round(totalValue / sold.length) : 0;

  const LOT_STATUS_STYLE: Record<string, string> = {
    SOLD: "bg-green-100 text-green-800",
    PASSED: "bg-gray-100 text-gray-600",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef] py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link href="/auction/results" className="text-sm text-[#2E7D32] hover:underline">← All Results</Link>
          <h1 className="mt-2 text-3xl font-black text-[#1B3A6B]">{session.title}</h1>
          <p className="text-[#5d7497] text-sm mt-0.5">
            {new Date(session.scheduledAt).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Lots Offered", value: results.length, color: "text-[#1B3A6B]" },
            { label: "Lots Sold", value: sold.length, color: "text-[#2E7D32]" },
            { label: "Clearance Rate", value: `${clearance}%`, color: "text-[#A07C3A]" },
            { label: "Total Value", value: zar(totalValue), color: "text-[#1B3A6B]" },
            { label: "Avg Price", value: sold.length > 0 ? zar(avgPrice) : "—", color: "text-[#5d7497]" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#e4ebf5] shadow-sm p-4 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#5d7497] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Results table */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e4ebf5] p-8 text-center text-[#5d7497]">
            No results recorded for this auction.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e4ebf5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f8fd] text-xs font-semibold text-[#5d7497] uppercase tracking-wide border-b border-[#e4ebf5]">
                  <tr>
                    <th className="px-4 py-3 text-left">Lot #</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Start Price</th>
                    <th className="px-4 py-3 text-right">Winning Bid</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Bids</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4fb]">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8fafd] transition">
                      <td className="px-4 py-3 font-mono text-xs text-[#9aabb9]">#{r.lotNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1B3A6B]">{r.lotTitle}</p>
                        {r.biddingNumber && r.lotStatus === "SOLD" && (
                          <p className="text-xs text-[#9aabb9]">Buyer: {r.biddingNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#5d7497] hidden sm:table-cell">{zar(r.startPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#2E7D32]">
                        {r.winningBid ? zar(r.winningBid) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#9aabb9] hidden md:table-cell">{r.totalBids}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${LOT_STATUS_STYLE[r.lotStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {r.lotStatus}
                        </span>
                        {r.lotStatus === "SOLD" && r.reserveMet && (
                          <span className="ml-1 text-[10px] text-green-600 font-bold">✓ Reserve</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
