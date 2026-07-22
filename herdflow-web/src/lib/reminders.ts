import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { sendListingExpiringEmail, sendTrialEndingEmail } from "@/lib/email";
import { env } from "@/lib/env";
import Expo from "expo-server-sdk";

const expo = new Expo();

/**
 * Push-notify the farm owner plus any manager/worker whose account points
 * at that owner (mirrors mobile-auth.ts's effectiveFarmerId resolution, in
 * reverse — here we're going from owner ID back out to the whole team) for
 * every owner ID in `farmerIds`. Shared by every reminder branch below so
 * the team-resolution + token-lookup + chunked-send logic exists once.
 */
async function notifyFarmTeams(farmerIds: string[], title: string, body: string): Promise<number> {
  if (farmerIds.length === 0) return 0;

  const teamProfiles = await withAdminContext((tx) =>
    tx.farmerProfile.findMany({
      where: { OR: [{ userId: { in: farmerIds } }, { ownerUserId: { in: farmerIds } }] },
      select: { userId: true },
    }),
  );
  const userIds = [...new Set([...farmerIds, ...teamProfiles.map((p) => p.userId)])];

  const tokenRecords = await withAdminContext((tx) =>
    tx.deviceToken.findMany({ where: { userId: { in: userIds }, isActive: true } }),
  );
  const validTokens = tokenRecords.map((t) => t.token).filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return 0;

  const messages = validTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title,
    body,
  }));

  let sentCount = 0;
  for (const chunk of expo.chunkPushNotifications(messages)) {
    const receipts = await expo.sendPushNotificationsAsync(chunk);
    sentCount += receipts.filter((r) => r.status === "ok").length;
  }
  return sentCount;
}

/**
 * Health events due in the next 2 days. Complements the mobile app's own
 * local scheduling (notification.service.ts, scheduleHealthEventReminder)
 * rather than replacing it: local scheduling fires from the device that
 * recorded the event; this reaches every device on the farm, and still
 * fires even if local scheduling never ran (e.g. notification permission
 * granted after the event was saved).
 */
async function sendHealthDueReminders(): Promise<number> {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const dueRecords = await withAdminContext((tx) =>
    tx.farmerHealthRecord.findMany({
      where: {
        status: "pending",
        followUpDate: { gte: new Date(now), lt: new Date(now + 2 * DAY) },
      },
      select: { farmerId: true, eventType: true },
    }),
  );
  if (dueRecords.length === 0) return 0;

  const farmerIds = [...new Set(dueRecords.map((r) => r.farmerId))];
  const body =
    dueRecords.length === 1
      ? `${dueRecords[0].eventType} due in the next 2 days`
      : `${dueRecords.length} health events due in the next 2 days`;
  return notifyFarmTeams(farmerIds, "🔔 Health reminder", body);
}

/**
 * Camps whose rest window ends in the next 2 days — availableForGrazingDate
 * (set by the mobile app's computeCampRestDates on a RESTING transition,
 * see EditCampScreen.tsx/AddCampScreen.tsx) falling in that range. Only
 * meaningful for camps this feature actually tracked a start date for —
 * a camp already RESTING before this shipped has no availableForGrazingDate
 * and is silently skipped rather than guessed at.
 */
async function sendCampRestReminders(): Promise<number> {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const readyCamps = await withAdminContext((tx) =>
    tx.farmerCamp.findMany({
      where: {
        isDeleted: false,
        currentStatus: "RESTING",
        availableForGrazingDate: { gte: new Date(now), lt: new Date(now + 2 * DAY) },
      },
      select: { farmerId: true, name: true },
    }),
  );
  if (readyCamps.length === 0) return 0;

  const farmerIds = [...new Set(readyCamps.map((c) => c.farmerId))];
  const body =
    readyCamps.length === 1
      ? `${readyCamps[0].name} is ready for grazing again soon`
      : `${readyCamps.length} camps are ready for grazing again soon`;
  return notifyFarmTeams(farmerIds, "🌱 Camp rest ending", body);
}

/**
 * Cron-callable (daily): each finder uses a ~24h-to-48h window (matching the
 * intended once-a-day cron cadence) instead of a "reminder sent" flag, so a
 * listing/subscription/health event naturally gets exactly one reminder as
 * it passes through the window on a single day's run.
 */
export async function sendDailyReminders(): Promise<{
  listingReminders: number;
  trialReminders: number;
  healthReminders: number;
  campRestReminders: number;
}> {
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

  const healthReminders = await sendHealthDueReminders().catch((err) => {
    console.error("Health due reminders failed:", err);
    return 0;
  });

  const campRestReminders = await sendCampRestReminders().catch((err) => {
    console.error("Camp rest reminders failed:", err);
    return 0;
  });

  return { listingReminders, trialReminders, healthReminders, campRestReminders };
}
