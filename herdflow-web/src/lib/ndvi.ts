// WEBSITE — herdflow-web/src/lib/ndvi.ts
// Config-driven NDVI interpretation/scoring + per-camp history. Replaces
// satellite.ts's old hardcoded interpretNdvi() (0.2/0.4/0.7 bands) --
// thresholds now come from NdviThresholdConfig, per explicit requirement
// that these never be hardcoded. satellite.ts still does the raw Copernicus
// fetch (ndvi + satellite pass date only); everything downstream of that raw
// number -- threshold lookup, score10/interpretation, trend vs. history, and
// reading/writing FarmerCampNdviReading -- lives here.
//
// Cutover complete: satellite.ts's old hardcoded interpretNdvi() and the old
// GET /api/app/satellite/ndvi route (raw lat/lon, no persistence) are gone.
// Every consumer -- mobile's CampsMapScreen/PastureAdvisoryScreen/
// ndvi.service.ts and this file's own routes -- goes through the
// campId-based flow below.
import type { Prisma } from "@prisma/client";
import { getVegetationHealth } from "@/lib/satellite";
import { parseGpsCoordinates } from "@/lib/geo";
import { withFarmerContext } from "@/lib/tenant-prisma";

export type NdviInterpretation = "poor" | "fair" | "good" | "excellent";
export type NdviTrend = "improving" | "declining" | "stable" | "unknown";

export interface NdviThresholds {
  id: string | null; // null for the emergency fallback (not a real config row)
  poorMax: number;
  moderateMax: number;
  goodMax: number;
  refreshIntervalDays: number;
}

// Only used if NdviThresholdConfig's seeded global-default row is somehow
// missing (should never happen after the migration) -- last resort so a
// broken lookup degrades to *a* sane answer instead of throwing.
const EMERGENCY_FALLBACK: NdviThresholds = {
  id: null,
  poorMax: 0.2,
  moderateMax: 0.4,
  goodMax: 0.6,
  refreshIntervalDays: 5,
};

// Falls back from the most specific match to the global default:
// (type, country) -> (type, null) -> (null, country) -> (null, null).
export async function getThresholds(
  tx: Prisma.TransactionClient,
  livestockType?: string | null,
  countryCode?: string | null,
): Promise<NdviThresholds> {
  const candidates: Array<{ livestockType: string | null; countryCode: string | null }> = [];
  if (livestockType && countryCode) candidates.push({ livestockType, countryCode });
  if (livestockType) candidates.push({ livestockType, countryCode: null });
  if (countryCode) candidates.push({ livestockType: null, countryCode });
  candidates.push({ livestockType: null, countryCode: null });

  for (const c of candidates) {
    const row = await tx.ndviThresholdConfig.findFirst({
      where: { livestockType: c.livestockType, countryCode: c.countryCode, isActive: true },
    });
    if (row) {
      return {
        id: row.id,
        poorMax: Number(row.poorMax),
        moderateMax: Number(row.moderateMax),
        goodMax: Number(row.goodMax),
        refreshIntervalDays: row.refreshIntervalDays,
      };
    }
  }
  return EMERGENCY_FALLBACK;
}

export function computeInterpretation(ndvi: number, thresholds: NdviThresholds): NdviInterpretation {
  if (ndvi < thresholds.poorMax) return "poor";
  if (ndvi < thresholds.moderateMax) return "fair";
  if (ndvi < thresholds.goodMax) return "good";
  return "excellent";
}

// Farmer-facing 1-10 score -- linear from raw NDVI, floored at 1 (never
// reads as "nothing" even for bare/negative NDVI), capped at 10.
export function computeScore10(ndvi: number): number {
  return Math.max(1, Math.min(10, Math.round(ndvi * 10)));
}

// +/-0.05 is treated as noise, not a real change. No prior reading at all
// (a camp's first-ever satellite pass) -> "unknown", nothing to compare.
export function computeTrend(currentNdvi: number, previousNdvi: number | null): NdviTrend {
  if (previousNdvi == null) return "unknown";
  const delta = currentNdvi - previousNdvi;
  if (delta > 0.05) return "improving";
  if (delta < -0.05) return "declining";
  return "stable";
}

export interface CampNdviSnapshot {
  reading: {
    id: string;
    ndvi: number;
    score10: number;
    interpretation: NdviInterpretation;
    satellitePassDate: Date;
    fetchedAt: Date;
    thumbnailUrl: string | null;
    aiAdvisory: string | null;
    aiAdvisoryPriority: string | null;
    aiAdvisoryAt: Date | null;
  };
  trend: NdviTrend;
  stale: boolean; // true if the returned reading is older than its own refreshIntervalDays
}

function toSnapshotReading(row: {
  id: string;
  ndvi: Prisma.Decimal;
  score10: number;
  interpretation: string;
  satellitePassDate: Date;
  fetchedAt: Date;
  thumbnailUrl: string | null;
  aiAdvisory: string | null;
  aiAdvisoryPriority: string | null;
  aiAdvisoryAt: Date | null;
}): CampNdviSnapshot["reading"] {
  return {
    id: row.id,
    ndvi: Number(row.ndvi),
    score10: row.score10,
    interpretation: row.interpretation as NdviInterpretation,
    satellitePassDate: row.satellitePassDate,
    fetchedAt: row.fetchedAt,
    thumbnailUrl: row.thumbnailUrl,
    aiAdvisory: row.aiAdvisory,
    aiAdvisoryPriority: row.aiAdvisoryPriority,
    aiAdvisoryAt: row.aiAdvisoryAt,
  };
}

// Read-only, no live Copernicus fetch ever -- for pages that render a list
// of many camps at once (the web camps map, the worst-first ranking panel,
// the PDF report) where triggering a live fetch per camp on every page view
// would make rendering as slow as however many camps are currently stale.
// Freshness for those surfaces instead comes from the proactive
// /api/cron/ndvi-refresh job (or the per-camp manual refresh button, which
// does call getOrRefreshCampNdvi below with force:true).
export async function getLatestStoredReading(
  farmerId: string,
  campId: string,
): Promise<CampNdviSnapshot | null> {
  const recent = await withFarmerContext(farmerId, (tx) =>
    tx.farmerCampNdviReading.findMany({
      where: { campId, farmerId, isDeleted: false },
      orderBy: { satellitePassDate: "desc" },
      take: 2,
    }),
  );
  const latest = recent[0] ?? null;
  const previous = recent[1] ?? null;
  if (!latest) return null;

  return {
    reading: toSnapshotReading(latest),
    trend: computeTrend(Number(latest.ndvi), previous ? Number(previous.ndvi) : null),
    stale: false, // staleness is only meaningful relative to a threshold config lookup; callers needing it should use getOrRefreshCampNdvi
  };
}

// Returns the latest stored reading for a camp, refreshing from Copernicus
// first if there is no reading yet, the latest is older than the configured
// refreshIntervalDays, or `force` is set (manual refresh button). Never
// throws on a Copernicus failure or a camp with no GPS set -- falls back to
// whatever is already stored (which may be null for a brand-new camp),
// matching "if Copernicus unreachable, show clear message and use cached
// data" (the clear-message part is the caller's job -- this returns null and
// lets the route/UI decide how to phrase that).
//
// Deliberately does NOT take an open Prisma transaction spanning the whole
// call -- withFarmerContext wraps its callback in prisma.$transaction, and
// the Copernicus fetch (OAuth token + Statistics API, both external HTTP
// calls) can easily take longer than a transaction's default timeout.
// Holding a DB transaction open across a slow external call is also a
// connection-pool-exhaustion risk under load regardless of timeout config.
// So: short read transaction, external fetch with no transaction open, short
// write transaction -- exactly the pattern this function follows below.
export async function getOrRefreshCampNdvi(
  camp: {
    id: string;
    farmerId: string;
    gpsCoordinates: string | null;
    hectares: Prisma.Decimal | number | null;
  },
  options: { livestockType?: string | null; countryCode?: string | null; force?: boolean } = {},
): Promise<CampNdviSnapshot | null> {
  const { thresholds, latest, previous } = await withFarmerContext(camp.farmerId, async (tx) => {
    const thresholds = await getThresholds(tx, options.livestockType, options.countryCode);
    const recent = await tx.farmerCampNdviReading.findMany({
      where: { campId: camp.id, farmerId: camp.farmerId, isDeleted: false },
      orderBy: { satellitePassDate: "desc" },
      take: 2,
    });
    return { thresholds, latest: recent[0] ?? null, previous: recent[1] ?? null };
  });

  const ageMs = latest ? Date.now() - latest.satellitePassDate.getTime() : Infinity;
  const staleByAge = ageMs > thresholds.refreshIntervalDays * 24 * 60 * 60 * 1000;
  const needsFetch = options.force || !latest || staleByAge;

  if (needsFetch && camp.gpsCoordinates) {
    const coords = parseGpsCoordinates(camp.gpsCoordinates);
    if (coords) {
      // No transaction open here -- this is the slow part (OAuth token +
      // Sentinel Hub Statistics API, both external network calls).
      const fresh = await getVegetationHealth(
        coords.lat,
        coords.lon,
        camp.hectares != null ? Number(camp.hectares) : null,
      ).catch(() => null);

      if (fresh) {
        const interpretation = computeInterpretation(fresh.ndvi, thresholds);
        const created = await withFarmerContext(camp.farmerId, (tx) =>
          tx.farmerCampNdviReading.create({
            data: {
              farmerId: camp.farmerId,
              campId: camp.id,
              ndvi: fresh.ndvi,
              score10: computeScore10(fresh.ndvi),
              interpretation,
              thresholdConfigId: thresholds.id,
              satellitePassDate: new Date(fresh.date),
            },
          }),
        );
        return {
          reading: toSnapshotReading({ ...created, interpretation }),
          trend: computeTrend(fresh.ndvi, latest ? Number(latest.ndvi) : null),
          stale: false,
        };
      }
    }
  }

  // No fresh fetch happened (not needed, no GPS, or Copernicus failed) --
  // fall back to whatever's already stored. Trend still computable from
  // history alone (latest vs. the one before it), independent of whether a
  // fetch happened this call.
  if (!latest) return null;
  return {
    reading: toSnapshotReading(latest),
    trend: computeTrend(Number(latest.ndvi), previous ? Number(previous.ndvi) : null),
    stale: staleByAge,
  };
}
