import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeCreativeWhere } from "@/lib/marketing/active-creative";

export const dynamic = "force-dynamic";

const VALID_PLACEMENTS = [
  "HOMEPAGE",
  "SHOP",
  "LISTINGS",
  "APP_HOME_BANNER",
  "APP_ANNOUNCEMENT",
  "WEB_HOMEPAGE",
  "WEB_MARKETPLACE",
  "EMAIL_HEADER",
  "PUSH_NOTIFICATION",
];

// Public endpoint the mobile app polls to render the current live campaign
// for a placement slot — same "effectively live" rules as the web banner
// (src/lib/marketing/active-creative.ts), just across the full placement
// list Ad Studio can target instead of only the 3 original web slots.
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
        placement: true,
        imageUrl: true,
        linkUrl: true,
        headline: true,
        subline: true,
        ctaText: true,
        ctaUrl: true,
        bgColor: true,
        textColor: true,
        template: true,
        sponsor: { select: { companyName: true } },
      },
    });
    return NextResponse.json({ creatives });
  } catch {
    return NextResponse.json({ creatives: [] });
  }
}
