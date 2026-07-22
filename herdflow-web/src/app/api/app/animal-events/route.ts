// WEBSITE — herdflow-web/src/app/api/app/animal-events/route.ts
//
// Auditable departure/mortality log for SA livestock traceability compliance
// (July 2026 Animal Diseases Act regulations require "auditable stock sheets
// detailing all animal arrivals, departures, and mortalities" — arrivals are
// already captured on FarmerAnimal itself via source/dateAcquired/etc, this
// covers the departure/mortality side that had no record at all before).
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

const EVENT_TYPES = ["SOLD", "DIED", "REMOVED"];

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const events = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerAnimalEvent.findMany({
      where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
      orderBy: { eventDate: "desc" },
    }),
  );
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.animalId || !b.eventType || !EVENT_TYPES.includes(String(b.eventType))) {
    return NextResponse.json({ error: "animalId and a valid eventType required" }, { status: 400 });
  }

  // Idempotent on localId — mirrors camp-movements/treatments/animals.
  const localId = (b.localId as string | undefined) ?? null;

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, String(b.animalId), auth.effectiveFarmerId);
    if (!animal) return { record: null, created: false };

    if (localId) {
      const existing = await tx.farmerAnimalEvent.findUnique({ where: { localId } });
      if (existing) return { record: existing, created: false };
    }

    const created = await tx.farmerAnimalEvent.create({
      data: {
        localId,
        animalId: String(b.animalId),
        farmerId: auth.effectiveFarmerId,
        eventType: String(b.eventType),
        eventDate: b.eventDate ? new Date(b.eventDate as string) : new Date(),
        salePrice: b.salePrice != null ? Number(b.salePrice) : null,
        buyerName: (b.buyerName as string | undefined) ?? null,
        causeOfDeath: (b.causeOfDeath as string | undefined) ?? null,
        notes: (b.notes as string | undefined) ?? null,
      },
    });
    return { record: created, created: true };
  });

  if (!result.record) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  return NextResponse.json(result.record, { status: result.created ? 201 : 200 });
}
