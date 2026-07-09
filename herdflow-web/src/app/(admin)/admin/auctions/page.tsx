import { prisma } from "@/lib/prisma";
import { AuctionsManager } from "./auctions-manager";

export const dynamic = "force-dynamic";

async function getSessions() {
  try {
    const sessions = await prisma.auctionSession.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        lots: {
          orderBy: { lotNumber: "asc" },
          include: { _count: { select: { bids: true } } },
        },
      },
    });
    return sessions;
  } catch {
    return [];
  }
}

export default async function AdminAuctionsPage() {
  const sessions = await getSessions();
  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-brand-navy text-3xl font-semibold">Live Auctions</h1>
        <p className="text-sm text-[#38537a]">
          Create auction sessions, add lots, and control live bidding. Auction inventory is separate
          from the storefront.
        </p>
      </header>
      <AuctionsManager initialSessions={sessions} />
    </main>
  );
}
