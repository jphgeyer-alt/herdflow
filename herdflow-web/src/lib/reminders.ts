import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { sendListingExpiringEmail, sendTrialEndingEmail } from "@/lib/email";
import { env } from "@/lib/env";

/**
 * Cron-callable (daily): each finder uses a ~24h window (matching the
 * intended once-a-day cron cadence) instead of a "reminder sent" flag, so a
 * listing/subscription naturally gets exactly one reminder as it passes
 * through the window on a single day's run.
 */
export async function sendDailyReminders(): Promise<{ listingReminders: number; trialReminders: number }> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const expiringListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: new Date(now + 2 * DAY), lt: new Date(now + 3 * DAY) },
    },
    include: { seller: { include: { user: { select: { fullName: true, email: true } } } } },
  });

  let listingReminders = 0;
  for (const listing of expiringListings) {
    if (!listing.seller.user.email) continue;
    await sendListingExpiringEmail({
      to: listing.seller.user.email,
      sellerName: listing.seller.farmName,
      listingTitle: listing.title,
      expiresDate: listing.expiresAt!.toLocaleDateString("en-ZA"),
      renewUrl: `${siteUrl}/seller/listings/new-listing`,
    }).catch((err) => console.error("Listing expiring email failed:", err));
    listingReminders++;
  }

  const endingTrials = await withAdminContext((tx) =>
    tx.subscription.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: { gte: new Date(now + 6 * DAY), lt: new Date(now + 7 * DAY) },
      },
      include: { user: { select: { fullName: true, email: true } }, plan: { select: { displayName: true } } },
    }),
  );

  let trialReminders = 0;
  for (const sub of endingTrials) {
    if (!sub.user.email) continue;
    await sendTrialEndingEmail({
      to: sub.user.email,
      userName: sub.user.fullName,
      planName: sub.plan.displayName,
      trialEndsDate: sub.trialEndsAt!.toLocaleDateString("en-ZA"),
      billingUrl: `${siteUrl}/pricing`,
    }).catch((err) => console.error("Trial ending email failed:", err));
    trialReminders++;
  }

  return { listingReminders, trialReminders };
}
