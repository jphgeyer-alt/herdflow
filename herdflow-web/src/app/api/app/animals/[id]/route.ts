// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// NOTE: FarmerHealthRecord/FarmerWeightRecord/FarmerVaccination.animalId are
// populated by mobile using the animal's local id (mobile has no way to send
// the real cuid there either), so those child lookups below must keep using
// the raw path param, not the resolved animal's real id — only the
// FarmerAnimal row's own primary key has the id-vs-localId problem that
// getAnimalForFarmer resolves.

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!animal) return null;

    const [health, weights, vaccinations] = await Promise.all([
      tx.farmerHealthRecord.findMany({
        where: { animalId: id, farmerId: auth.effectiveFarmerId },
        orderBy: { eventDate: "desc" },
      }),
      tx.farmerWeightRecord.findMany({
        where: { animalId: id, farmerId: auth.effectiveFarmerId },
        orderBy: { recordedDate: "desc" },
      }),
      tx.farmerVaccination.findMany({
        where: { animalId: id, farmerId: auth.effectiveFarmerId },
        orderBy: { nextDueDate: "asc" },
      }),
    ]);

    return { ...animal, health, weights, vaccinations };
  });

  if (!result) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  return NextResponse.json(result);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    getAnimalForFarmer(tx, id, auth.effectiveFarmerId),
  );
  if (!existing) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const data = {
    ...(b.tag != null && { tagNumber: String(b.tag) }),
    ...(b.name != null && { name: String(b.name) }),
    ...(b.species != null && { species: String(b.species) }),
    ...(b.breed != null && { breed: String(b.breed) }),
    ...(b.gender != null && { gender: String(b.gender) }),
    ...(b.birthDate != null && { dateOfBirth: new Date(b.birthDate as string) }),
    ...(b.weight != null && { weight: Number(b.weight) }),
    ...(b.campId != null && { camp: String(b.campId) }),
    ...(b.campId == null && b.assignedCampId != null && { camp: String(b.assignedCampId) }),
    ...(b.note != null && { notes: String(b.note) }),
    ...(b.status != null && { status: String(b.status) }),
    ...(b.healthStatus != null && { healthStatus: String(b.healthStatus) }),
    ...(b.source != null && { source: String(b.source) }),
    ...(b.purchasePrice != null && { purchasePrice: Number(b.purchasePrice) }),
    ...(b.dateAcquired != null && { dateAcquired: new Date(b.dateAcquired as string) }),
    ...(b.auctionHouse != null && { auctionHouse: String(b.auctionHouse) }),
    ...(b.sellerName != null && { sellerName: String(b.sellerName) }),
    ...(b.prevFarm != null && { prevFarm: String(b.prevFarm) }),
  };

  // expectedVersion is optional — omitted by older app builds or any entity
  // type not yet migrated to conflict detection, in which case this behaves
  // exactly as an unconditional update always has.
  if (b.expectedVersion == null) {
    const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
      tx.farmerAnimal.update({ where: { id: existing.id }, data }),
    );
    return NextResponse.json(updated);
  }

  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const { count } = await tx.farmerAnimal.updateMany({
      where: { id: existing.id, version: Number(b.expectedVersion) },
      data: { ...data, version: { increment: 1 } },
    });
    if (count === 0) {
      const current = await tx.farmerAnimal.findUnique({ where: { id: existing.id } });
      return { conflict: true as const, current };
    }
    return { conflict: false as const, current: await tx.farmerAnimal.findUnique({ where: { id: existing.id } }) };
  });

  if (result.conflict) {
    return NextResponse.json({ conflict: true, current: result.current }, { status: 409 });
  }
  return NextResponse.json(result.current);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const deleted = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const existing = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!existing) return false;

    // Soft delete — all health records preserved
    await tx.farmerAnimal.update({ where: { id: existing.id }, data: { isDeleted: true } });
    return true;
  });
  if (!deleted) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
