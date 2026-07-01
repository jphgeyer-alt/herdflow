type LiveAuctionPageProps = {
  params: Promise<{ auctionId: string }>;
};

export default async function LiveAuctionPage({ params }: LiveAuctionPageProps) {
  const { auctionId } = await params;

  return (
    <main className="space-y-3">
      <h1 className="text-3xl font-bold">Live Auction: {auctionId}</h1>
      <p className="text-neutral-700">Real-time bidding module placeholder for next phase.</p>
    </main>
  );
}
