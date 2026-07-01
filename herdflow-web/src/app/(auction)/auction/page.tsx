import Link from "next/link";

export default function AuctionPage() {
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-bold">Live Auctions</h1>
      <p className="text-neutral-700">Auction lots are fully separate inventory from store products.</p>
      <Link className="rounded-lg bg-neutral-900 px-4 py-2 text-white" href="/auction/live/demo-auction">
        Enter Demo Live Room
      </Link>
    </main>
  );
}
