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

function currentWeekMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// PRICE_PUSH_NOTIFICATION isn't a SponsorCreative placement — it's a weekly
// booking (EmailSponsorship), separate from the Ad Studio's open-ended
// placement system, so it's resolved before the placement-based lookup
// below. Impressions increment here (when the push-send flow actually
// queries this), not on every idle poll.
async function getPricePushSponsor() {
  const weekStart = currentWeekMonday();
  const booking = await prisma.emailSponsorship.findUnique({
    where: { slotType_weekStart: { slotType: "PRICE_PUSH_NOTIFICATION", weekStart } },
    include: { sponsor: { select: { companyName: true } }, creative: true },
  });
  if (!booking || !booking.creative || !booking.creative.isActive) return [];

  await prisma.sponsorCreative.update({
    where: { id: booking.creative.id },
    data: { impressions: { increment: 1 } },
  });

  return [
    {
      id: booking.creative.id,
      placement: "PRICE_PUSH_NOTIFICATION",
      imageUrl: booking.creative.imageUrl,
      linkUrl: booking.creative.linkUrl,
      headline: booking.creative.headline,
      subline: booking.creative.subline,
      ctaText: booking.creative.ctaText,
      ctaUrl: booking.creative.ctaUrl,
      bgColor: booking.creative.bgColor,
      textColor: booking.creative.textColor,
      template: booking.creative.template,
      sponsor: booking.sponsor,
    },
  ];
}

// Public endpoint the mobile app polls to render the current live campaign
// for a placement slot — same "effectively live" rules as the web banner
// (src/lib/marketing/active-creative.ts), just across the full placement
// list Ad Studio can target instead of only the 3 original web slots.
export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get("placement");

  if (placement === "PRICE_PUSH_NOTIFICATION") {
    try {
      return NextResponse.json({ creatives: await getPricePushSponsor() });
    } catch {
      return NextResponse.json({ creatives: [] });
    }
  }

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
