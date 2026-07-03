import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LiveAuctionRoom } from "./live-auction-room";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ auctionId: string }> };

async function getSession(slug: string) {
  try {
    return await prisma.auctionSession.findUnique({
      where: { slug },
      include: {
        lots: {
          orderBy: { lotNumber: "asc" },
          include: { _count: { select: { bids: true } } },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function LiveAuctionPage({ params }: PageProps) {
  const { auctionId } = await params;
  const session = await getSession(auctionId);

  if (!session) {
    notFound();
  }

  const initialLots = session.lots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    title: l.title,
    breed: l.breed,
    weightKg: l.weightKg,
    region: l.region,
    species: l.species ?? null,
    quantity: l.quantity ?? 1,
    images: Array.isArray(l.images) ? l.images as string[] : [],
    startingPriceCents: l.startingPriceCents,
    reservePriceCents: l.reservePriceCents,
    currentBidCents: l.currentBidCents,
    winnerName: l.winnerName,
    status: l.status,
    _count: l._count,
  }));

  return (
    <main className="space-y-5 pb-10">
      <nav className="text-sm text-[#38537a]">
        <Link className="font-semibold text-brand-navy" href="/auction">
          ← All Auctions
        </Link>
      </nav>

      <header className="rounded-2xl bg-gradient-to-r from-brand-navy to-[#254f8e] p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9c08f]">
          {session.status === "LIVE" ? "🟢 Live Now" : session.status}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{session.title}</h1>
        {session.description && (
          <p className="mt-2 max-w-xl text-sm text-[#ecf1f8]">{session.description}</p>
        )}
      </header>

      <LiveAuctionRoom
        auctionId={session.slug}
        auctionTitle={session.title}
        auctionStatus={session.status}
        initialLots={initialLots}
      />
    </main>
  );
}
