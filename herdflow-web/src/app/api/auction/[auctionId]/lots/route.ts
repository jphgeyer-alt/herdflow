import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ auctionId: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { auctionId } = await params;

  try {
    const session = await prisma.auctionSession.findUnique({
      where: { slug: auctionId },
      include: {
        lots: {
          orderBy: { lotNumber: "asc" },
          include: {
            _count: { select: { bids: true } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error("[auction/lots GET]", err);
    return NextResponse.json({ error: "Failed to fetch lots" }, { status: 500 });
  }
}
