// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Covers the new farm-wide health endpoint added to fold vaccinations into
// health events (mobile's only "add a vaccine" flow writes here, not the
// separate, dead FarmerVaccination table).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-health-farmwide";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-health-farmwide",
    email: "test@example.com",
    fullName: "Test User",
    phone: null,
    role: "FARMER",
    isAdmin: false,
    effectiveFarmerId: TEST_FARMER_ID,
  })),
  isMobileUser: (val: unknown) => !(val instanceof Response),
}));

import { GET } from "./route";

function getHealth() {
  return GET(new Request("http://localhost/api/app/health"));
}

describe("GET /api/app/health — farm-wide", () => {
  let realAnimalId: string;
  const localAnimalId = "11111";

  beforeEach(async () => {
    const animal = await prisma.farmerAnimal.create({
      data: {
        farmerId: TEST_FARMER_ID,
        species: "cattle",
        localId: localAnimalId,
        tagNumber: "F-001",
        name: "Bessie",
      },
    });
    realAnimalId = animal.id;
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerHealthRecord.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("returns health records across all animals, enriched with the animal's name/tag", async () => {
    await prisma.farmerHealthRecord.create({
      data: {
        farmerId: TEST_FARMER_ID,
        animalId: localAnimalId, // mobile stores whichever id it sent, usually the local one
        eventType: "Vaccine",
        eventDate: new Date("2026-01-01"),
      },
    });

    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      eventType: "Vaccine",
      animalName: "Bessie",
      animalTag: "F-001",
    });
  });

  it("still resolves the animal name when animalId is the real cuid, not the local id", async () => {
    await prisma.farmerHealthRecord.create({
      data: {
        farmerId: TEST_FARMER_ID,
        animalId: realAnimalId,
        eventType: "Check-up",
        eventDate: new Date("2026-01-01"),
      },
    });

    const res = await getHealth();
    const body = await res.json();
    expect(body[0]).toMatchObject({ animalName: "Bessie", animalTag: "F-001" });
  });

  it("only returns records for the authenticated farmer", async () => {
    const otherFarmer = "test-farmer-health-farmwide-other";
    await prisma.farmerHealthRecord.create({
      data: {
        farmerId: otherFarmer,
        animalId: "someone-elses-animal",
        eventType: "Vaccine",
        eventDate: new Date("2026-01-01"),
      },
    });

    const res = await getHealth();
    const body = await res.json();
    expect(body).toHaveLength(0);

    await prisma.farmerHealthRecord.deleteMany({ where: { farmerId: otherFarmer } });
  });
});
