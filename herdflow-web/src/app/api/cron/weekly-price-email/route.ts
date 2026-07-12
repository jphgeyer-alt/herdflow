import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getMarketPrices } from "@/lib/market-prices";
import { sendWeeklyMarketPriceEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function currentWeekMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // back up to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

// Called by a scheduled job (Render cron — see README) with:
//   Authorization: Bearer <CRON_SECRET>
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prices = await getMarketPrices();
    const weekStart = currentWeekMonday();

    const booking = await prisma.emailSponsorship.findUnique({
      where: { slotType_weekStart: { slotType: "THURSDAY_PRICE_EMAIL", weekStart } },
      include: { sponsor: true, creative: true },
    });

    const sponsor =
      booking?.creative && booking.creative.isActive
        ? {
            name: booking.sponsor.companyName,
            imageUrl: booking.creative.imageUrl,
            linkUrl: `${env.NEXT_PUBLIC_SITE_URL || ""}/api/marketing/creatives/${booking.creative.id}/click`,
          }
        : null;

    // FarmerProfile has no Prisma relation back to User (bare userId column),
    // so this is a two-step lookup rather than a nested `where`.
    const farmerProfiles = await prisma.farmerProfile.findMany({ select: { userId: true } });
    const farmerUserIds = farmerProfiles.map((f) => f.userId);

    const recipients = await prisma.user.findMany({
      where: { id: { in: farmerUserIds }, marketingConsent: true },
      select: { email: true, fullName: true },
    });

    const unsubscribeNote =
      "You're receiving this because you opted in to HerdFlow marketing emails. Manage your preferences in your account settings.";

    let sent = 0;
    for (const recipient of recipients) {
      await sendWeeklyMarketPriceEmail({
        to: recipient.email,
        farmerName: recipient.fullName,
        prices: {
          beef: prices.beef,
          mutton: prices.mutton,
          feed: prices.feed,
        },
        sponsor,
        unsubscribeNote,
      }).catch((err) => console.error("Weekly price email failed for", recipient.email, err));
      sent++;
    }

    if (booking?.creativeId && sent > 0) {
      await prisma.sponsorCreative.update({
        where: { id: booking.creativeId },
        data: { impressions: { increment: sent } },
      });
    }

    return NextResponse.json({ ok: true, sent, sponsored: Boolean(sponsor) });
  } catch (err) {
    console.error("weekly-price-email cron error:", err);
    return NextResponse.json({ error: "Failed to send weekly price emails." }, { status: 500 });
  }
}
