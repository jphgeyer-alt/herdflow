export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ auctionId: string }> };

/**
 * SSE endpoint — clients receive a JSON event every 3 seconds with the
 * current bid state for all OPEN lots in this auction session.
 *
 * Event format: `data: { lots: AuctionLotSnapshot[] }\n\n`
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const { auctionId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let keepGoing = true;

      const push = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          keepGoing = false;
        }
      };

      const sendSnapshot = async () => {
        try {
          const lots = await prisma.auctionLot.findMany({
            where: { session: { slug: auctionId }, status: { in: ["PENDING", "OPEN", "SOLD", "PASSED"] } },
            orderBy: { lotNumber: "asc" },
            select: {
              id: true,
              lotNumber: true,
              title: true,
              breed: true,
              weightKg: true,
              region: true,
              startingPriceCents: true,
              reservePriceCents: true,
              currentBidCents: true,
              winnerName: true,
              status: true,
              _count: { select: { bids: true } },
            },
          });
          push(`data: ${JSON.stringify({ lots })}\n\n`);
        } catch {
          push(`data: ${JSON.stringify({ error: "snapshot_failed" })}\n\n`);
        }
      };

      // Initial snapshot
      await sendSnapshot();

      // Poll every 3 s
      const interval = setInterval(async () => {
        if (!keepGoing) {
          clearInterval(interval);
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          return;
        }
        await sendSnapshot();
      }, 3000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
