// herdflow-web/src/lib/farm-camps/queries.ts
// Lightweight camp-health summary for the Hub dashboard KPI tile.
// Deliberately NOT buildPastureReport() (src/lib/pastureReport.ts) --
// that function opens one withFarmerContext transaction PER CAMP (via
// Promise.all over getLatestStoredReading), which is exactly what was
// exhausting the DB's connection_limit=3 pool on the Camps page for farms
// with several camps ("Unable to start a transaction in the given time").
// The Hub loads on every visit, so reusing that pattern here would make
// the pool problem worse, not better. This does the whole farm in two
// queries total, not one per camp.
import { withFarmerContext } from "@/lib/tenant-prisma";

export interface CampHealthSummary {
  avgScore: number | null; // 0-10, null if no camps have an NDVI reading yet
  campCount: number;
}

export async function getCampHealthSummary(farmerId: string): Promise<CampHealthSummary> {
  const camps = await withFarmerContext(farmerId, (tx) =>
    tx.farmerCamp.findMany({ where: { farmerId, isDeleted: false }, select: { id: true } }),
  );
  if (camps.length === 0) return { avgScore: null, campCount: 0 };

  const campIds = camps.map((c) => c.id);
  const readings = await withFarmerContext(farmerId, (tx) =>
    tx.farmerCampNdviReading.findMany({
      where: { farmerId, campId: { in: campIds }, isDeleted: false },
      orderBy: [{ campId: "asc" }, { satellitePassDate: "desc" }],
      select: { campId: true, score10: true },
    }),
  );

  const latestByCamp = new Map<string, number>();
  for (const r of readings) {
    if (!latestByCamp.has(r.campId)) latestByCamp.set(r.campId, r.score10);
  }

  const scores = [...latestByCamp.values()];
  if (scores.length === 0) return { avgScore: null, campCount: camps.length };

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return { avgScore, campCount: camps.length };
}
