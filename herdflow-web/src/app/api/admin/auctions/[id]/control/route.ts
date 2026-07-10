import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const session = await prisma.auctionSession.findUnique({
      where: { id },
      include: {
        lots: {
          orderBy: { lotNumber: "asc" },
          include: {
            _count: { select: { bids: true } },
            bids: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        },
        registrations: {
          where: { status: "APPROVED" },
          select: { biddingNumber: true, fullName: true, email: true },
        },
      },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action as string;

  try {
    // ── Session-level actions ─────────────────────────────────────────────
    if (action === "start-session") {
      await prisma.auctionSession.update({ where: { id }, data: { status: "LIVE" } });
      return NextResponse.json({ ok: true, message: "Auction is now LIVE" });
    }

    if (action === "pause-session") {
      await prisma.auctionSession.update({ where: { id }, data: { status: "UPCOMING" } });
      // Pause all open lots
      await prisma.auctionLot.updateMany({
        where: { sessionId: id, status: "OPEN" },
        data: { status: "PENDING" },
      });
      return NextResponse.json({ ok: true, message: "Auction paused" });
    }

    if (action === "end-session") {
      await prisma.auctionSession.update({
        where: { id },
        data: { status: "CLOSED", closedAt: new Date() },
      });
      // Pass all remaining open/pending lots
      const pendingLots = await prisma.auctionLot.findMany({
        where: { sessionId: id, status: { in: ["OPEN", "PENDING"] } },
      });
      for (const lot of pendingLots) {
        await prisma.auctionLot.update({ where: { id: lot.id }, data: { status: "PASSED" } });
        await prisma.auctionResult.create({
          data: {
            sessionId: id,
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            lotTitle: lot.title,
            startPrice: lot.startingPriceCents,
            lotStatus: "PASSED",
            totalBids: 0,
          },
        });
      }
      return NextResponse.json({ ok: true, message: "Auction ended" });
    }

    // ── Lot-level actions ─────────────────────────────────────────────────
    const lotId = body.lotId as string;
    if (!lotId)
      return NextResponse.json({ error: "lotId required for lot actions" }, { status: 400 });

    const lot = await prisma.auctionLot.findUnique({
      where: { id: lotId },
      include: { _count: { select: { bids: true } } },
    });
    if (!lot || lot.sessionId !== id)
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });

    if (action === "open-lot") {
      // Close any other open lots first
      await prisma.auctionLot.updateMany({
        where: { sessionId: id, status: "OPEN" },
        data: { status: "PENDING" },
      });
      await prisma.auctionLot.update({ where: { id: lotId }, data: { status: "OPEN" } });
      return NextResponse.json({ ok: true, message: `Lot ${lot.lotNumber} is now open` });
    }

    if (action === "sell-lot") {
      if (!lot.currentBidCents || lot.currentBidCents === 0) {
        return NextResponse.json({ error: "No bids on this lot" }, { status: 400 });
      }
      const reserveMet = !lot.reservePriceCents || lot.currentBidCents >= lot.reservePriceCents;
      await prisma.auctionLot.update({
        where: { id: lotId },
        data: { status: "SOLD", winnerEmail: lot.winnerEmail, winnerName: lot.winnerName },
      });
      await prisma.auctionResult.create({
        data: {
          sessionId: id,
          lotId,
          lotNumber: lot.lotNumber,
          lotTitle: lot.title,
          winnerEmail: lot.winnerEmail,
          winningBid: lot.currentBidCents,
          reserveMet,
          totalBids: lot._count.bids,
          startPrice: lot.startingPriceCents,
          lotStatus: "SOLD",
          soldAt: new Date(),
        },
      });
      return NextResponse.json({
        ok: true,
        message: `Lot ${lot.lotNumber} SOLD for R${(lot.currentBidCents / 100).toFixed(0)}`,
      });
    }

    if (action === "pass-lot") {
      await prisma.auctionLot.update({ where: { id: lotId }, data: { status: "PASSED" } });
      await prisma.auctionResult.create({
        data: {
          sessionId: id,
          lotId,
          lotNumber: lot.lotNumber,
          lotTitle: lot.title,
          totalBids: lot._count.bids,
          startPrice: lot.startingPriceCents,
          lotStatus: "PASSED",
        },
      });
      return NextResponse.json({ ok: true, message: `Lot ${lot.lotNumber} passed` });
    }

    if (action === "withdraw-lot") {
      await prisma.auctionLot.update({ where: { id: lotId }, data: { status: "CANCELLED" } });
      await prisma.auctionResult.create({
        data: {
          sessionId: id,
          lotId,
          lotNumber: lot.lotNumber,
          lotTitle: lot.title,
          totalBids: lot._count.bids,
          startPrice: lot.startingPriceCents,
          lotStatus: "CANCELLED",
        },
      });
      return NextResponse.json({ ok: true, message: `Lot ${lot.lotNumber} withdrawn` });
    }

    if (action === "manual-bid") {
      const amount = Number(body.amount);
      const bidderName = String(body.bidderName || "Phone Bid");
      const bidderEmail = String(body.bidderEmail || "phone@bid.manual");
      if (!amount || amount <= (lot.currentBidCents ?? 0)) {
        return NextResponse.json({ error: "Bid must be higher than current bid" }, { status: 400 });
      }
      await prisma.auctionBid.create({
        data: { lotId, bidderName, bidderEmail, amountCents: amount },
      });
      await prisma.auctionLot.update({
        where: { id: lotId },
        data: { currentBidCents: amount, winnerName: bidderName, winnerEmail: bidderEmail },
      });
      return NextResponse.json({
        ok: true,
        message: `Manual bid of R${(amount / 100).toFixed(0)} placed`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Control room error:", err);
    return NextResponse.json(
      { error: "Action failed", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}
