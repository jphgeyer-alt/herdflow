import { prisma } from "@/lib/prisma";
import { withAdminContext } from "@/lib/tenant-prisma";

/**
 * Real, database-backed platform stats for public marketing surfaces
 * (homepage stats strip, sponsor pitch page). Previously these were
 * hardcoded, fabricated numbers ("10,000+ Active Farmers" etc.) — every
 * value here is a genuine count as of the moment it's computed, so it
 * grows honestly as the business grows instead of needing manual edits.
 */
export type PlatformStats = {
  /** Registered users with the FARMER role. */
  activeFarmers: number;
  /** Non-deleted animals currently tracked across all farms. */
  herdsManaged: number;
  /** Active, non-deleted shop products. */
  products: number;
  /** Auction sessions that have closed. */
  auctionsCompleted: number;
  /** Delivery/transport requests ever booked. */
  transportBookings: number;
  /** Total registered accounts across all roles — used as a "reach" proxy
   *  where a hardcoded "page views" number used to sit; there's no
   *  analytics/pageview tracking in this app to compute that honestly. */
  registeredUsers: number;
  /** Approved sellers + approved logistics partners. */
  registeredBusinesses: number;
  /** Distinct provinces represented among approved sellers. */
  provincesCovered: number;
  /** Sum of SOLD listing prices in the last 30 days, in cents. */
  livestockTradedLast30DaysCents: number;
};

const EMPTY_STATS: PlatformStats = {
  activeFarmers: 0,
  herdsManaged: 0,
  products: 0,
  auctionsCompleted: 0,
  transportBookings: 0,
  registeredUsers: 0,
  registeredBusinesses: 0,
  provincesCovered: 0,
  livestockTradedLast30DaysCents: 0,
};

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeFarmers,
      herdsManaged,
      products,
      auctionsCompleted,
      transportBookings,
      registeredUsers,
      approvedSellers,
      approvedLogisticsPartners,
      provinceRows,
      soldListings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "FARMER" } }),
      prisma.farmerAnimal.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      prisma.auctionSession.count({ where: { status: "CLOSED" } }),
      withAdminContext((tx) => tx.deliveryRequest.count()),
      prisma.user.count(),
      prisma.seller.count({ where: { status: "APPROVED" } }),
      prisma.logisticsPartner.count({ where: { status: "APPROVED" } }),
      prisma.seller.findMany({
        where: { status: "APPROVED" },
        select: { region: true },
        distinct: ["region"],
      }),
      prisma.listing.findMany({
        where: { status: "SOLD", updatedAt: { gte: thirtyDaysAgo } },
        select: { priceCents: true },
      }),
    ]);

    return {
      activeFarmers,
      herdsManaged,
      products,
      auctionsCompleted,
      transportBookings,
      registeredUsers,
      registeredBusinesses: approvedSellers + approvedLogisticsPartners,
      provincesCovered: provinceRows.length,
      livestockTradedLast30DaysCents: soldListings.reduce((sum, l) => sum + l.priceCents, 0),
    };
  } catch (err) {
    console.error("getPlatformStats error:", err);
    return EMPTY_STATS;
  }
}
