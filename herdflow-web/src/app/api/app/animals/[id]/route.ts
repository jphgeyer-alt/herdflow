// WEBSITE — herdflow-web/src/app/api/app/animals/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getAnimalForFarmer(id: string, farmerId: string) {
  return prisma.farmerAnimal.findFirst({
    where: { id, farmerId, isDeleted: false },
  });
}

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const animal = await getAnimalForFarmer(id, auth.id);
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const [health, weights, vaccinations] = await Promise.all([
    prisma.farmerHealthRecord.findMany({ where: { animalId: id }, orderBy: { eventDate: "desc" } }),
    prisma.farmerWeightRecord.findMany({ where: { animalId: id }, orderBy: { recordedDate: "desc" } }),
    prisma.farmerVaccination.findMany({ where: { animalId: id }, orderBy: { nextDueDate: "asc" } }),
  ]);

  return NextResponse.json({ ...animal, health, weights, vaccinations });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await getAnimalForFarmer(id, auth.id);
  if (!existing) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const updated = await prisma.farmerAnimal.update({
    where: { id },
    data: {
      ...(b.tag       != null && { tagNumber:    String(b.tag) }),
      ...(b.name      != null && { name:         String(b.name) }),
      ...(b.species   != null && { species:      String(b.species) }),
      ...(b.breed     != null && { breed:        String(b.breed) }),
      ...(b.gender    != null && { gender:       String(b.gender) }),
      ...(b.birthDate != null && { dateOfBirth:  new Date(b.birthDate as string) }),
      ...(b.weight    != null && { weight:       Number(b.weight) }),
      ...(b.campId    != null && { camp:         String(b.campId) }),
      ...(b.note      != null && { notes:        String(b.note) }),
      ...(b.status    != null && { status:       String(b.status) }),
      ...(b.healthStatus != null && { healthStatus: String(b.healthStatus) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const { id } = await ctx.params;
  const existing = await getAnimalForFarmer(id, auth.id);
  if (!existing) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  // Soft delete — all health records preserved
  await prisma.farmerAnimal.update({ where: { id }, data: { isDeleted: true } });
  return NextResponse.json({ success: true });
}
