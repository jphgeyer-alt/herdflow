// WEBSITE — herdflow-web/src/lib/pastureReport.ts
// Shared "all camps, ranked worst NDVI first" data used by both the web
// camps map's ranking side panel and the Pasture Report PDF export -- one
// place computing the ranking so the two can never disagree. Read-only
// (getLatestStoredReading, no live Copernicus calls) so viewing the page or
// generating a PDF never blocks on satellite fetches -- freshness comes
// from the proactive cron job / manual per-camp refresh instead.
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getCampsWithHeadCounts } from "@/lib/camps";
import { getLatestStoredReading, type CampNdviSnapshot } from "@/lib/ndvi";

export interface PastureReportCamp {
  id: string;
  name: string;
  currentStatus: string;
  notes: string | null;
  hectares: number | null;
  currentHeadCount: number;
  gpsCoordinates: string | null;
  ndvi: CampNdviSnapshot | null;
}

export interface PastureReport {
  generatedAt: Date;
  camps: PastureReportCamp[]; // sorted worst NDVI score first; camps with no reading yet sort last
}

export async function buildPastureReport(farmerId: string): Promise<PastureReport> {
  const camps = await withFarmerContext(farmerId, (tx) => getCampsWithHeadCounts(tx, farmerId));

  const withNdvi: PastureReportCamp[] = await Promise.all(
    camps.map(async (camp) => ({
      id: camp.id,
      name: camp.name,
      currentStatus: camp.currentStatus,
      notes: camp.notes,
      hectares: camp.hectares != null ? Number(camp.hectares) : null,
      currentHeadCount: camp.currentHeadCount,
      gpsCoordinates: camp.gpsCoordinates,
      ndvi: await getLatestStoredReading(farmerId, camp.id),
    })),
  );

  // No-reading camps sort last (99) -- nothing actionable to rank them by
  // yet, and putting them first would bury the camps that actually need
  // attention under "first satellite pass still pending" entries.
  withNdvi.sort((a, b) => (a.ndvi?.reading.score10 ?? 99) - (b.ndvi?.reading.score10 ?? 99));

  return { generatedAt: new Date(), camps: withNdvi };
}
