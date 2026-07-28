// WEBSITE — herdflow-web/src/lib/camps.ts
// Shared by GET /api/app/camps (mobile sync) and the CAMPS-MAP web page --
// one place computing "live animal count per camp" so the two surfaces
// can't drift on what counts as "currently in this camp".
import type { Prisma } from "@prisma/client";

export interface CampLivestockSummary {
  totalCount: number;
  primaryLivestockType: string | null; // most common species currently in the camp, for NDVI threshold lookup + AI advisory context
  species: { species: string; count: number }[]; // full breakdown, most common first
}

// Used by the NDVI advisory (species-specific thresholds, "suitable for
// cattle" style copy) -- campId is only a reliable link since CAMPS-MAP
// added FarmerAnimal.campId; this simply groups whatever's there now.
export async function getCampLivestockSummary(
  tx: Prisma.TransactionClient,
  campId: string,
  farmerId: string,
): Promise<CampLivestockSummary> {
  const groups = await tx.farmerAnimal.groupBy({
    by: ["species"],
    where: { campId, farmerId, isDeleted: false, status: "ACTIVE" },
    _count: true,
    orderBy: { _count: { species: "desc" } },
  });

  const species = groups.map((g) => ({ species: g.species, count: g._count }));
  return {
    totalCount: species.reduce((sum, s) => sum + s.count, 0),
    primaryLivestockType: species[0]?.species ?? null,
    species,
  };
}

export async function getCampsWithHeadCounts(tx: Prisma.TransactionClient, farmerId: string) {
  const [camps, counts] = await Promise.all([
    tx.farmerCamp.findMany({
      where: { farmerId, isDeleted: false },
      orderBy: { name: "asc" },
    }),
    tx.farmerAnimal.groupBy({
      by: ["campId"],
      where: { farmerId, isDeleted: false, status: "ACTIVE", campId: { not: null } },
      _count: true,
    }),
  ]);

  const countByCampId = new Map(counts.map((c) => [c.campId as string, c._count]));
  return camps.map((camp) => ({
    ...camp,
    currentHeadCount: countByCampId.get(camp.id) ?? 0,
  }));
}
