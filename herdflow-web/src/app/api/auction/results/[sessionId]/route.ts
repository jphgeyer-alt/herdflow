import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { sessionId } = await params;
  try {
    const [session, results] = await Promise.all([
      prisma.auctionSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          title: true,
          slug: true,
          scheduledAt: true,
          closedAt: true,
          status: true,
          description: true,
        },
      }),
      prisma.auctionResult.findMany({
        where: { sessionId },
        orderBy: { lotNumber: "asc" },
      }),
    ]);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session, results });
  } catch {
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}
