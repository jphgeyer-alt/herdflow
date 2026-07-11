import type { Prisma } from "@prisma/client";

/**
 * Shared "is this creative live right now" filter — used by both the
 * existing web banner endpoint and /api/ads/active (mobile). SCHEDULED
 * campaigns need no cron to flip to LIVE: they simply pass this filter
 * once their startDate arrives, and stop passing once endDate is reached.
 * DRAFT/PAUSED/ENDED never pass regardless of dates.
 */
export function activeCreativeWhere(
  placement: string,
  now: Date = new Date(),
): Prisma.SponsorCreativeWhereInput {
  return {
    placement: placement as never,
    isActive: true,
    status: { notIn: ["DRAFT", "PAUSED", "ENDED"] },
    sponsor: { status: "ACTIVE" },
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  };
}
