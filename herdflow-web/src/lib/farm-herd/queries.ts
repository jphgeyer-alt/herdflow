// herdflow-web/src/lib/farm-herd/queries.ts
// Shared data-access for the farm herd web section — the desktop-page twin
// of src/app/api/app/animals/* (mobile, bearer-token auth). Deliberately
// separate from that route: web pages read via the cookie session
// (getFarmWebUser) and call Prisma directly, same pattern as
// farm-finance/queries.ts.
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getAnimalForFarmer } from "@/lib/tenant-lookups";

export async function listAnimals(farmerId: string) {
  return withFarmerContext(farmerId, (tx) =>
    tx.farmerAnimal.findMany({
      where: { farmerId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function getAnimalDetail(farmerId: string, id: string) {
  return withFarmerContext(farmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, id, farmerId);
    if (!animal) return null;

    const [health, weights, vaccinations] = await Promise.all([
      tx.farmerHealthRecord.findMany({
        where: { animalId: animal.id, farmerId },
        orderBy: { eventDate: "desc" },
      }),
      tx.farmerWeightRecord.findMany({
        where: { animalId: animal.id, farmerId },
        orderBy: { recordedDate: "desc" },
      }),
      tx.farmerVaccination.findMany({
        where: { animalId: animal.id, farmerId },
        orderBy: { nextDueDate: "asc" },
      }),
    ]);

    return { animal, health, weights, vaccinations };
  });
}

export interface NewAnimalInput {
  name: string | null;
  species: string;
  breed: string | null;
  gender: string | null;
  tagNumber: string | null;
  dateOfBirth: Date | null;
  weight: number | null;
  colour: string | null;
  camp: string | null;
  notes: string | null;
  source: string | null;
  purchasePrice: number | null;
  dateAcquired: Date | null;
}

export async function createAnimal(farmerId: string, input: NewAnimalInput) {
  return withFarmerContext(farmerId, (tx) =>
    tx.farmerAnimal.create({
      data: {
        farmerId,
        name: input.name,
        species: input.species,
        breed: input.breed,
        gender: input.gender,
        tagNumber: input.tagNumber,
        dateOfBirth: input.dateOfBirth,
        weight: input.weight,
        colour: input.colour,
        camp: input.camp,
        notes: input.notes,
        source: input.source,
        purchasePrice: input.purchasePrice,
        dateAcquired: input.dateAcquired,
      },
    }),
  );
}

export async function updateAnimal(
  farmerId: string,
  id: string,
  input: Partial<NewAnimalInput>,
) {
  return withFarmerContext(farmerId, async (tx) => {
    const existing = await getAnimalForFarmer(tx, id, farmerId);
    if (!existing) return null;
    return tx.farmerAnimal.update({
      where: { id: existing.id },
      data: input,
    });
  });
}

export async function addWeightRecord(
  farmerId: string,
  animalId: string,
  input: { weight: number; bodyConditionScore: number | null; notes: string | null; recordedDate: Date },
) {
  return withFarmerContext(farmerId, async (tx) => {
    const animal = await getAnimalForFarmer(tx, animalId, farmerId);
    if (!animal) return null;

    const [record] = await Promise.all([
      tx.farmerWeightRecord.create({
        data: {
          animalId: animal.id,
          farmerId,
          weight: input.weight,
          bodyConditionScore: input.bodyConditionScore,
          notes: input.notes,
          recordedDate: input.recordedDate,
        },
      }),
      tx.farmerAnimal.update({ where: { id: animal.id }, data: { weight: input.weight } }),
    ]);
    return record;
  });
}
