// WEBSITE — herdflow-web/src/app/api/app/health/route.ts
//
// Farm-wide health records (all animals), unlike animals/[id]/health which
// is scoped to one animal. Added so the mobile app's Vaccination Schedule
// screen can list "Vaccine" type health events across the whole herd —
// previously it read from the separate FarmerVaccination table, which the
// app's only "add a vaccine" flow (Add Health Event) never actually wrote
// to, so the schedule screen could never show anything.
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const [records, animals] = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    Promise.all([
      tx.farmerHealthRecord.findMany({
        where: { farmerId: auth.effectiveFarmerId },
        orderBy: { eventDate: "desc" },
      }),
      tx.farmerAnimal.findMany({
        where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
        select: { id: true, localId: true, name: true, tagNumber: true },
      }),
    ]),
  );

  // Health records store whichever id the mobile app sent for animalId —
  // usually the animal's local id, occasionally its real cuid — so match
  // against both to resolve a display name (mirrors getAnimalForFarmer's
  // id-or-localId fallback, done here as a lookup map instead since this
  // enriches a whole list rather than a single record).
  const byId = new Map(animals.map((a) => [a.id, a]));
  const byLocalId = new Map(animals.filter((a) => a.localId).map((a) => [a.localId as string, a]));

  const enriched = records.map((r) => {
    const animal = byId.get(r.animalId) ?? byLocalId.get(r.animalId);
    return {
      ...r,
      animalName: animal?.name ?? animal?.tagNumber ?? r.animalId,
      animalTag: animal?.tagNumber ?? null,
    };
  });

  return NextResponse.json(enriched);
}
