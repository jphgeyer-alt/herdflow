import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeCreativeWhere } from "@/lib/marketing/active-creative";

export const dynamic = "force-dynamic";

const VALID_PLACEMENTS = ["HOMEPAGE", "SHOP", "LISTINGS"];

export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get("placement");
  if (!placement || !VALID_PLACEMENTS.includes(placement)) {
    return NextResponse.json({ creatives: [] });
  }

  try {
    const creatives = await prisma.sponsorCreative.findMany({
      where: activeCreativeWhere(placement),
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
