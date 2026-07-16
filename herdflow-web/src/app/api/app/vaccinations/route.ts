// WEBSITE — herdflow-web/src/app/api/app/vaccinations/route.ts
import { NextResponse } from "next/server";
import { requireMobileUser, isMobileUser } from "@/lib/mobile-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (!isMobileUser(auth)) return auth;

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Get all animals for this farmer to resolve names
  const [allVaccinations, animals] = await withFarmerContext(auth.effectiveFarmerId, (tx) =>
    Promise.all([
      tx.farmerVaccination.findMany({
        where: { farmerId: auth.effectiveFarmerId },
        orderBy: { nextDueDate: "asc" },
      }),
      tx.farmerAnimal.findMany({
        where: { farmerId: auth.effectiveFarmerId, isDeleted: false },
        select: { id: true, name: true, tagNumber: true },
      }),
    ]),
  );

  const animalMap = new Map(animals.map((a) => [a.id, a]));

  const enrich = (v: (typeof allVaccinations)[number]) => ({
    ...v,
    animalName:
      animalMap.get(v.animalId)?.name ?? animalMap.get(v.animalId)?.tagNumber ?? v.animalId,
    animalTag: animalMap.get(v.animalId)?.tagNumber ?? null,
  });

  const overdue = allVaccinations
    .filter((v) => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate < now)
    .map(enrich);
  const thisWeek = allVaccinations
    .filter(
      (v) =>
        v.status !== "COMPLETED" &&
        v.nextDueDate &&
        v.nextDueDate >= now &&
        v.nextDueDate <= sevenDaysLater,
    )
    .map(enrich);
  const upcoming = allVaccinations
    .filter((v) => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate > sevenDaysLater)
    .map(enrich);
  const completed = allVaccinations.filter((v) => v.status === "COMPLETED").map(enrich);

  return NextResponse.json({ overdue, thisWeek, upcoming, completed });
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

  if (!b.animalId || !b.vaccineName)
    return NextResponse.json({ error: "animalId and vaccineName are required" }, { status: 400 });

  const vaccination = await withFarmerContext(auth.effectiveFarmerId, async (tx) => {
    // Verify the animal belongs to this farmer (id-or-localId, same as
    // every other child-record route — mobile addresses animals by their
    // local id, which never matches the real cuid on a raw lookup).
    const animal = await getAnimalForFarmer(tx, b.animalId as string, auth.effectiveFarmerId);
    if (!animal) return null;

    return tx.farmerVaccination.create({
      data: {
        animalId: b.animalId as string,
        farmerId: auth.effectiveFarmerId,
        vaccineName: b.vaccineName as string,
        batchNumber: (b.batchNumber as string | undefined) ?? null,
        administeredBy: (b.administeredBy as string | undefined) ?? null,
        vetName: (b.vetName as string | undefined) ?? null,
        cost: b.cost != null ? Number(b.cost) : null,
        vaccinatedDate: b.vaccinatedDate ? new Date(b.vaccinatedDate as string) : null,
        nextDueDate: b.nextDueDate ? new Date(b.nextDueDate as string) : null,
        status: (b.status as string | undefined) ?? "SCHEDULED",
        notes: (b.notes as string | undefined) ?? null,
      },
    });
  });

  if (!vaccination) return NextResponse.json({ error: "Animal not found" }, { status: 404 });

  return NextResponse.json(vaccination, { status: 201 });
}
