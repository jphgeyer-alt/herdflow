import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ auctionId: string }> };

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export async function POST(request: Request, { params }: RouteContext) {
  const { auctionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const lotId = b.lotId;
  const bidderName = b.bidderName;
  const bidderEmail = b.bidderEmail;
  const amountCents = b.amountCents;

  if (!isString(lotId)) return NextResponse.json({ error: "lotId required" }, { status: 400 });
  if (!isString(bidderName))
    return NextResponse.json({ error: "bidderName required" }, { status: 400 });
  if (!isString(bidderEmail) || !isEmail(bidderEmail))
    return NextResponse.json({ error: "Valid bidderEmail required" }, { status: 400 });
  if (typeof amountCents !== "number" || amountCents < 1)
    return NextResponse.json({ error: "amountCents must be a positive integer" }, { status: 400 });

  try {
    // Verify the lot belongs to this session and is OPEN
    const lot = await prisma.auctionLot.findFirst({
      where: { id: lotId, session: { slug: auctionId }, status: "OPEN" },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot not found or not open for bidding" }, { status: 404 });
    }

    const minBid = Math.max(lot.startingPriceCents, lot.currentBidCents + 1);
    if (amountCents < minBid) {
      return NextResponse.json(
        { error: `Bid must be at least ${minBid} cents (ZAR ${(minBid / 100).toFixed(2)})` },
        { status: 422 },
      );
    }

    const [bid] = await prisma.$transaction([
      prisma.auctionBid.create({
        data: {
          lotId,
          bidderName: bidderName.trim(),
          bidderEmail: bidderEmail.trim().toLowerCase(),
          amountCents,
        },
      }),
      prisma.auctionLot.update({
        where: { id: lotId },
        data: {
          currentBidCents: amountCents,
          winnerEmail: bidderEmail.trim().toLowerCase(),
          winnerName: bidderName.trim(),
        },
      }),
    ]);

    return NextResponse.json({ bid }, { status: 201 });
  } catch (err) {
    console.error("[auction/bids POST]", err);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
