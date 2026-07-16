// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Regression test for the same class of bug as the health/weights routes:
// POST verified animal ownership with a raw `farmerAnimal.findFirst({ id:
// b.animalId, farmerId })`, which never matches the *local* id the mobile
// app sends as animalId — so every vaccination create 404'd and was
// silently dropped, confirmed against production data (0 FarmerVaccination
// rows existed).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-vaccinations-localid-fallback";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-vaccinations-localid",
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

function postVaccination(body: unknown) {
  return POST(
    new Request("http://localhost/api/app/vaccinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/app/vaccinations — localId fallback", () => {
  const localId = "98765";

  beforeEach(async () => {
    await prisma.farmerAnimal.create({
      data: { farmerId: TEST_FARMER_ID, species: "cattle", localId },
    });
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerVaccination.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("creates a vaccination when animalId in the body is the animal's local id, not its real cuid", async () => {
    const res = await postVaccination({ animalId: localId, vaccineName: "Blackleg" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.vaccineName).toBe("Blackleg");
  });

  it("still 404s for an animalId that matches neither a real animal nor any localId", async () => {
    const res = await postVaccination({ animalId: "does-not-exist", vaccineName: "Blackleg" });
    expect(res.status).toBe(404);
  });
});
