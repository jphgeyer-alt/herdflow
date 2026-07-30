// herdflow-web/src/lib/farm-health/queries.ts
// Shared data-access for the farm health web section — the desktop-page
// twin of src/app/api/app/{health,vaccinations,medicines}/* (mobile,
// bearer-token auth). Same withFarmerContext + direct-Prisma pattern as
// farm-finance/queries.ts and farm-herd/queries.ts.
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export async function listHealthRecords(farmerId: string) {
  const [records, animals] = await withFarmerContext(farmerId, (tx) =>
    Promise.all([
      tx.farmerHealthRecord.findMany({
        where: { farmerId },
        orderBy: { eventDate: "desc" },
        take: 200,
      }),
      tx.farmerAnimal.findMany({
        where: { farmerId, isDeleted: false },
        select: { id: true, localId: true, name: true, tagNumber: true },
      }),
    ]),
  );

  const byId = new Map(animals.map((a) => [a.id, a]));
  const byLocalId = new Map(animals.filter((a) => a.localId).map((a) => [a.localId as string, a]));

  return records.map((r) => {
    const animal = byId.get(r.animalId) ?? byLocalId.get(r.animalId);
    return {
      ...r,
      animalName: animal?.name ?? animal?.tagNumber ?? r.animalId,
    };
  });
}

export async function listAnimalsForSelect(farmerId: string) {
  return withFarmerContext(farmerId, (tx) =>
    tx.farmerAnimal.findMany({
      where: { farmerId, isDeleted: false },
      select: { id: true, name: true, tagNumber: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export interface NewHealthEventInput {
  animalId: string;
  eventType: string;
  description: string | null;
  diagnosis: string | null;
  treatment: string | null;
  vetName: string | null;
  severity: string | null;
  cost: number | null;
  followUpDate: Date | null;
  eventDate: Date;
}

export async function createHealthEvent(farmerId: string, input: NewHealthEventInput) {
  return withFarmerContext(farmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, input.animalId, farmerId);
    if (!animal) return null;

    return tx.farmerHealthRecord.create({
      data: {
        animalId: animal.id,
        farmerId,
        eventType: input.eventType,
        description: input.description,
        diagnosis: input.diagnosis,
        treatment: input.treatment,
        vetName: input.vetName,
        severity: input.severity,
        cost: input.cost,
        followUpDate: input.followUpDate,
        eventDate: input.eventDate,
      },
    });
  });
}

export async function listVaccinationsBucketed(farmerId: string) {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [vaccinations, animals] = await withFarmerContext(farmerId, (tx) =>
    Promise.all([
      tx.farmerVaccination.findMany({
        where: { farmerId },
        orderBy: { nextDueDate: "asc" },
      }),
      tx.farmerAnimal.findMany({
        where: { farmerId, isDeleted: false },
        select: { id: true, name: true, tagNumber: true },
      }),
    ]),
  );

  const animalMap = new Map(animals.map((a) => [a.id, a]));
  const enrich = (v: (typeof vaccinations)[number]) => ({
    ...v,
    animalName: animalMap.get(v.animalId)?.name ?? animalMap.get(v.animalId)?.tagNumber ?? v.animalId,
  });

  const overdue = vaccinations
    .filter((v) => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate < now)
    .map(enrich);
  const thisWeek = vaccinations
    .filter((v) => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate >= now && v.nextDueDate <= sevenDaysLater)
    .map(enrich);
  const upcoming = vaccinations
    .filter((v) => v.status !== "COMPLETED" && v.nextDueDate && v.nextDueDate > sevenDaysLater)
    .map(enrich);
  const completed = vaccinations.filter((v) => v.status === "COMPLETED").map(enrich);

  return { overdue, thisWeek, upcoming, completed };
}

export async function listMedicines(farmerId: string) {
  return withFarmerContext(farmerId, (tx) =>
    tx.farmerMedicine.findMany({
      where: { farmerId, isActive: true },
      orderBy: { name: "asc" },
    }),
  );
}

export interface NewMedicineInput {
  name: string;
  category: string;
  manufacturer: string | null;
  dosageUnit: string | null;
  quantityInStock: number;
  reorderLevel: number | null;
  notes: string | null;
}

export async function createMedicine(farmerId: string, input: NewMedicineInput) {
  return withFarmerContext(farmerId, (tx) =>
    tx.farmerMedicine.create({
      data: {
        farmerId,
        name: input.name,
        category: input.category,
        manufacturer: input.manufacturer,
        dosageUnit: input.dosageUnit,
        quantityInStock: input.quantityInStock,
        reorderLevel: input.reorderLevel,
        notes: input.notes,
      },
    }),
  );
}
