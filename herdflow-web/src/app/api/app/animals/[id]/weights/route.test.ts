// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Regression test for a real production bug, same class as the health
// route: a raw `farmerAnimal.findFirst({ id, farmerId })` lookup never
// matches the *local* id the mobile app addresses animals by, so weight
// entries 404'd and were silently dropped by the sync queue — confirmed
// against production data: only 2 FarmerWeightRecord rows existed despite
// 77 real animals. Also covers a second bug found alongside it: the
// animal's own weight update at the end of POST used the raw path param
// instead of the resolved animal's real id, which would throw once the
// lookup itself was fixed (farmerAnimal.update() throws on a non-matching
// `where`).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-weights-localid-fallback";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-weights-localid",
    email: "test@example.com",
    fullName: "Test User",
    phone: null,
    role: "FARMER",
    isAdmin: false,
    effectiveFarmerId: TEST_FARMER_ID,
  })),
  isMobileUser: (val: unknown) => !(val instanceof Response),
}));

import { POST, GET } from "./route";

function postWeight(localId: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/app/animals/${localId}/weights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: localId }) },
  );
}

function getWeights(localId: string) {
  return GET(new Request(`http://localhost/api/app/animals/${localId}/weights`), {
    params: Promise.resolve({ id: localId }),
  });
}

describe("POST/GET /api/app/animals/[id]/weights — localId fallback", () => {
  const localId = "54321";
  let realId: string;

  beforeEach(async () => {
    const animal = await prisma.farmerAnimal.create({
      data: { farmerId: TEST_FARMER_ID, species: "cattle", localId, weight: 100 },
    });
    realId = animal.id;
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerWeightRecord.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("creates a weight record and updates the animal's current weight when addressed by local id", async () => {
    const res = await postWeight(localId, { weight: 250 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.weight).toBe(250);

    const animal = await prisma.farmerAnimal.findUniqueOrThrow({ where: { id: realId } });
    expect(Number(animal.weight)).toBe(250);
  });

  it("lists weight records when addressed by local id", async () => {
    await postWeight(localId, { weight: 250 });
    const res = await getWeights(localId);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it("still 404s for an id that matches neither a real animal nor any localId", async () => {
    const res = await postWeight("does-not-exist", { weight: 250 });
    expect(res.status).toBe(404);
  });
});
