// WEBSITE — herdflow-web/src/app/api/app/vaccinations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Get all animals for this farmer to resolve names
  const [allVaccinations, animals] = await Promise.all([
    prisma.farmerVaccination.findMany({
      where: { farmerId: auth.effectiveFarmerId },
      orderBy: { nextDueDate: "asc" },
    }),
    prisma.farmerAnimal.findMany({
      where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
      select: { id: true, name: true, tagNumber: true },
    }),
  ]);

  const animalMap = new Map(animals.map(a => [a.id, a]));

  const enrich = (v: typeof allVaccinations[number]) => ({
    ...v,
    animalName: animalMap.get(v.animalId)?.name ?? animalMap.get(v.animalId)?.tagNumber ?? v.animalId,
    animalTag:  animalMap.get(v.animalId)?.tagNumber ?? null,
  });

  const overdue    = allVaccinations.filter(v => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate < now).map(enrich);
  const thisWeek   = allVaccinations.filter(v => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate >= now && v.nextDueDate <= sevenDaysLater).map(enrich);
  const upcoming   = allVaccinations.filter(v => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate > sevenDaysLater).map(enrich);
  const completed  = allVaccinations.filter(v => v.status === "COMPLETED").map(enrich);

  return NextResponse.json({ overdue, thisWeek, upcoming, completed });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (!b.animalId || !b.vaccineName)
    return NextResponse.json({ error: "animalId and vaccineName are required" }, { status: 400 });

  // Verify the animal belongs to this farmer
  const animal = await prisma.farmerAnimal.findFirst({
    where: { id: b.animalId as string, farmerId: auth.effectiveFarmerId, isDeleted: false },
  });
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  const vaccination = await prisma.farmerVaccination.create({
    data: {
      animalId:      b.animalId as string,
      farmerId:      auth.id,
      vaccineName:   b.vaccineName as string,
      batchNumber:   (b.batchNumber   as string | undefined) ?? null,
      administeredBy:(b.administeredBy as string | undefined) ?? null,
      vetName:       (b.vetName       as string | undefined) ?? null,
      cost:          b.cost != null ? Number(b.cost) : null,
      vaccinatedDate:b.vaccinatedDate ? new Date(b.vaccinatedDate as string) : null,
      nextDueDate:   b.nextDueDate    ? new Date(b.nextDueDate as string)    : null,
      status:        (b.status as string | undefined) ?? "SCHEDULED",
      notes:         (b.notes  as string | undefined) ?? null,
    },
  });

  return NextResponse.json(vaccination, { status: 201 });
}
