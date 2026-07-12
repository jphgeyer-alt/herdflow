import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";
import { env } from "@/lib/env";
import { generateDueRecurringExpenses } from "@/lib/expenses/recurring";

export const dynamic = "force-dynamic";

// Called by a scheduled job (Render cron — see README) with:
//   Authorization: Bearer <CRON_SECRET>
// Expires classifieds and directory subscriptions past their expiry, and
// (bundled in since it's the same "expire past-due rows" job) livestock
// Listings too — that gap pre-dates this change and was cheap to close
// alongside it. Recurring expense generation is bundled in for the same
// reason: it's a daily "process due rows" job, no separate Render Cron Job
// needed.
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  if (!env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const [classifieds, listings, directories, recurringExpenses] = await Promise.all([
      prisma.classified.updateMany({
        where: { status: "ACTIVE", expiresAt: { lt: now } },
        data: { status: "ARCHIVED" },
      }),
      withAdminContext((tx) =>
        tx.listing.updateMany({
          where: { status: "ACTIVE", expiresAt: { lt: now } },
          data: { status: "ARCHIVED" },
        }),
      ),
      prisma.directoryListing.updateMany({
        where: { subscriptionActive: true, renewsAt: { lt: now } },
        data: { subscriptionActive: false },
      }),
      generateDueRecurringExpenses(),
    ]);

    return NextResponse.json({
      ok: true,
      classifiedsExpired: classifieds.count,
      listingsExpired: listings.count,
      directorySubscriptionsExpired: directories.count,
      recurringExpensesGenerated: recurringExpenses.generated,
    });
  } catch (err) {
    console.error("housekeeping cron error:", err);
    return NextResponse.json({ error: "Failed to run housekeeping." }, { status: 500 });
  }
}
