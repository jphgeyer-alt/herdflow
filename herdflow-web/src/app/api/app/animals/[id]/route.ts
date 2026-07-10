// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getAnimalForFarmer(tx: Prisma.TransactionClient, id: string, farmerId: string) {
  return tx.farmerAnimal.findFirst({
    where: { id, farmerId, isDeleted: false },
  });
}

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const result = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!animal) return null;

    const [health, weights, vaccinations] = await Promise.all([
      tx.farmerHealthRecord.findMany({ where: { animalId: id }, orderBy: { eventDate: "desc" } }),
      tx.farmerWeightRecord.findMany({
        where: { animalId: id },
        orderBy: { recordedDate: "desc" },
      }),
      tx.farmerVaccination.findMany({ where: { animalId: id }, orderBy: { nextDueDate: "asc" } }),
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

  const updated = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    tx.farmerAnimal.update({
      where: { id },
      data: {
        ...(b.tag != null && { tagNumber: String(b.tag) }),
        ...(b.name != null && { name: String(b.name) }),
        ...(b.species != null && { species: String(b.species) }),
        ...(b.breed != null && { breed: String(b.breed) }),
        ...(b.gender != null && { gender: String(b.gender) }),
        ...(b.birthDate != null && { dateOfBirth: new Date(b.birthDate as string) }),
        ...(b.weight != null && { weight: Number(b.weight) }),
        ...(b.campId != null && { camp: String(b.campId) }),
        ...(b.note != null && { notes: String(b.note) }),
        ...(b.status != null && { status: String(b.status) }),
        ...(b.healthStatus != null && { healthStatus: String(b.healthStatus) }),
      },
    }),
  );

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const deleted = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    const existing = await getAnimalForFarmer(tx, id, auth.effectiveFarmerId);
    if (!existing) return false;

    // Soft delete — all health records preserved
    await tx.farmerAnimal.update({ where: { id }, data: { isDeleted: true } });
    return true;
  });
  if (!deleted) return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
