// WEBSITE — herdflow-web/src/lib/ndviRefresh.ts
// Proactive background NDVI refresh -- see /api/cron/ndvi-refresh. Without
// this, a camp's NDVI only refreshes reactively when a farmer happens to
// view it (getOrRefreshCampNdvi in ndvi.ts). Running this on a schedule
// means fresh data is usually already waiting by the time anyone looks,
// matching "auto-refresh every 5 days per camp" as genuinely proactive
// rather than only lazy/on-view.
import { withAdminContext } from "@/lib/tenant-prisma";
import { getCampLivestockSummary } from "@/lib/camps";
import { getOrRefreshCampNdvi } from "@/lib/ndvi";
import { prisma } from "@/lib/prisma";

export async function refreshStaleNdviReadings(): Promise<{
  checked: number;
  refreshed: number;
  failed: number;
}> {
  const camps = await withAdminContext((tx) =>
    tx.farmerCamp.findMany({
      where: { isDeleted: false, gpsCoordinates: { not: null } },
      select: { id: true, farmerId: true, gpsCoordinates: true, hectares: true },
    }),
  );

  let refreshed = 0;
  let failed = 0;

  // Sequential, not Promise.all -- Copernicus's Statistics API is a
  // free-tier quota, and hammering it concurrently for every camp on every
  // farm at once is exactly the kind of thing that quota exists to prevent.
  // getOrRefreshCampNdvi checks each camp's own configured
  // refreshIntervalDays internally, so most calls here are a fast no-op
  // (not due yet) -- this job can run daily without over-fetching.
  for (const camp of camps) {
    try {
      const profile = await prisma.farmerProfile.findFirst({
        where: { userId: camp.farmerId },
        select: { country: true },
      });
      const livestock = await withAdminContext((tx) => getCampLivestockSummary(tx, camp.id, camp.farmerId));

      const snapshot = await getOrRefreshCampNdvi(camp, {
        livestockType: livestock.primaryLivestockType,
        countryCode: profile?.country ?? null,
      });
      if (snapshot) refreshed++;
    } catch (err) {
      console.error(`[ndvi-refresh] camp ${camp.id}:`, err);
      failed++;
    }
  }

  return { checked: camps.length, refreshed, failed };
}
