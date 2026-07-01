import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await prisma.auctionSession.findMany({
      where: { status: { in: ["UPCOMING", "LIVE"] } },
      orderBy: { scheduledAt: "asc" },
      include: {
        _count: { select: { lots: true } },
      },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[auction/sessions GET]", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
