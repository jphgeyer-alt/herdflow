// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Covers the new medicine-stock deduction: recording a treatment that used
// a tracked medicine must decrement that medicine's quantityInStock by the
// dosage administered — this is the "amount applied to each animal" the
// inventory previously had no way to reflect.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-treatments-stock";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-treatments-stock",
    email: "test@example.com",
    fullName: "Test User",
    phone: null,
    role: "FARMER",
    isAdmin: false,
    effectiveFarmerId: TEST_FARMER_ID,
  })),
  isMobileUser: (val: unknown) => !(val instanceof Response),
}));

import { POST } from "./route";

function postTreatment(body: unknown) {
  return POST(
    new Request("http://localhost/api/app/treatments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/app/treatments — medicine stock deduction", () => {
  let medicineId: string;
  const animalLocalId = "22222";

  beforeEach(async () => {
    await prisma.farmerAnimal.create({
      data: { farmerId: TEST_FARMER_ID, species: "cattle", localId: animalLocalId, weight: 250 },
    });
    const medicine = await prisma.farmerMedicine.create({
      data: {
        farmerId: TEST_FARMER_ID,
        name: "Terramycin",
        category: "ANTIBIOTIC",
        dosagePerKg: 0.02,
        quantityInStock: 100,
      },
    });
    medicineId = medicine.id;
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerMedicine.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerTreatment.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("deducts the administered dosage from the medicine's stock", async () => {
    const res = await postTreatment({
      animalId: animalLocalId,
      medicineId,
      medicineName: "Terramycin",
      treatmentType: "INJECTION",
      dosage: 5,
    });
    expect(res.status).toBe(201);

    const medicine = await prisma.farmerMedicine.findUniqueOrThrow({ where: { id: medicineId } });
    expect(Number(medicine.quantityInStock)).toBe(95);
  });

  it("does not deduct stock when no medicineId is given (unlisted/adhoc medicine)", async () => {
    await postTreatment({
      animalId: animalLocalId,
      medicineName: "Some ad-hoc remedy",
      treatmentType: "ORAL",
      dosage: 5,
    });

    const medicine = await prisma.farmerMedicine.findUniqueOrThrow({ where: { id: medicineId } });
    expect(Number(medicine.quantityInStock)).toBe(100);
  });

  it("does not double-deduct on a retried (idempotent) POST with the same localId", async () => {
    const body = {
      localId: "retry-1",
      animalId: animalLocalId,
      medicineId,
      medicineName: "Terramycin",
      treatmentType: "INJECTION",
      dosage: 5,
    };
    await postTreatment(body);
    await postTreatment(body); // retried, e.g. after a flaky network response

    const medicine = await prisma.farmerMedicine.findUniqueOrThrow({ where: { id: medicineId } });
    expect(Number(medicine.quantityInStock)).toBe(95);
  });
});
