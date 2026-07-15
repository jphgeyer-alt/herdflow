// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml). This is deliberate: the
// conflict-detection guarantee rests on a conditional `updateMany` being
// race-safe under real concurrent writes, which a mocked transaction cannot
// prove. Never run this against a real farm's database — it creates and
// deletes rows scoped to TEST_FARMER_ID only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-animals";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-animals",
    email: "test@example.com",
    fullName: "Test User",
    phone: null,
    role: "FARMER",
    isAdmin: false,
    effectiveFarmerId: TEST_FARMER_ID,
  })),
  isMobileUser: (val: unknown) => !(val instanceof Response),
}));

import { PATCH } from "./route";

function patchAnimal(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/animals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/animals/[id] — conflict detection", () => {
  let animalId: string;

  beforeEach(async () => {
    const animal = await prisma.farmerAnimal.create({
      data: { farmerId: TEST_FARMER_ID, species: "cattle", tagNumber: "TEST-001" },
    });
    animalId = animal.id;
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchAnimal(animalId, { name: "Bessie" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Bessie");
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchAnimal(animalId, { name: "Bessie", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Bessie");
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchAnimal(animalId, { name: "Bessie", expectedVersion: 1 });

    const res = await patchAnimal(animalId, { name: "Clover", expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.name).toBe("Bessie");
    expect(body.current.version).toBe(2);
  });

  it("under real concurrent writes, exactly one of two same-version PATCHes succeeds", async () => {
    const [a, b] = await Promise.all([
      patchAnimal(animalId, { name: "Bessie", expectedVersion: 1 }),
      patchAnimal(animalId, { name: "Clover", expectedVersion: 1 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = await prisma.farmerAnimal.findUniqueOrThrow({ where: { id: animalId } });
    expect(winner.version).toBe(2);
    expect(["Bessie", "Clover"]).toContain(winner.name);
  });
});
