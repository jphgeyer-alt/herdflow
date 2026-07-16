// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-breeding";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-breeding",
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

function patchBreeding(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/breeding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/breeding/[id] — conflict detection", () => {
  let recordId: string;

  beforeEach(async () => {
    const record = await prisma.farmerBreedingRecord.create({
      data: {
        farmerId: TEST_FARMER_ID,
        femaleAnimalId: "test-animal-1",
        femaleAnimalTag: "F-001",
        species: "cattle",
        breedingDate: new Date("2026-01-01"),
      },
    });
    recordId = record.id;
  });

  afterEach(async () => {
    await prisma.farmerBreedingRecord.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchBreeding(recordId, { outcome: "SUCCESSFUL" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.outcome).toBe("SUCCESSFUL");
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchBreeding(recordId, { outcome: "SUCCESSFUL", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchBreeding(recordId, { outcome: "SUCCESSFUL", expectedVersion: 1 });

    const res = await patchBreeding(recordId, { offspringCount: 1, expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.outcome).toBe("SUCCESSFUL");
    expect(body.current.version).toBe(2);
  });

  it("under real concurrent writes, exactly one of two same-version PATCHes succeeds", async () => {
    const [a, b] = await Promise.all([
      patchBreeding(recordId, { outcome: "SUCCESSFUL", expectedVersion: 1 }),
      patchBreeding(recordId, { outcome: "FAILED", expectedVersion: 1 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = await prisma.farmerBreedingRecord.findUniqueOrThrow({
      where: { id: recordId },
    });
    expect(winner.version).toBe(2);
  });
});
