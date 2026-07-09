import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_PLACEMENTS = ["HOMEPAGE", "SHOP", "LISTINGS"];

export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get("placement");
  if (!placement || !VALID_PLACEMENTS.includes(placement)) {
    return NextResponse.json({ creatives: [] });
  }

  try {
    const now = new Date();
    const creatives = await prisma.sponsorCreative.findMany({
      where: {
        placement: placement as "HOMEPAGE" | "SHOP" | "LISTINGS",
        isActive: true,
        sponsor: { status: "ACTIVE" },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        imageUrl: true,
        linkUrl: true,
        sponsor: { select: { companyName: true } },
      },
    });
    return NextResponse.json({ creatives });
  } catch {
    return NextResponse.json({ creatives: [] });
  }
}
