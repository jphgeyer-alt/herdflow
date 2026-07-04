// WEBSITE — herdflow-web/src/app/api/app/content/route.ts
// GET: Return active app content for mobile farmers

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  try {
    const [announcements, banners, tips, auctionAlerts, promotions] = await Promise.all([
      prisma.appContent.findMany({
        where: {
          type: "ANNOUNCEMENT", status: "ACTIVE", isDeleted: false,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      prisma.appContent.findMany({
        where: {
          type: "BANNER", status: "ACTIVE", isDeleted: false,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
      prisma.appContent.findMany({
        where: {
          type: "TIP", status: "ACTIVE", isDeleted: false,
          OR: [
            { scheduledDate: null },
            { scheduledDate: { gte: todayStart, lte: todayEnd } },
          ],
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      }),
      prisma.appContent.findMany({
        where: { type: "AUCTION_ALERT", status: "ACTIVE", isDeleted: false },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      prisma.appContent.findMany({
        where: {
          type: "PROMOTION", status: "ACTIVE", isDeleted: false,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
        },
        take: 2,
      }),
    ]);

    return NextResponse.json({ announcements, banners, tips, auctionAlerts, promotions });
  } catch (err) {
    console.error("[GET /api/app/content]", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
