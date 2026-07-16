// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml). Marking a scheduled
// vaccination "COMPLETED" is a realistic double-entry race (two team
// members both administering/logging the same due vaccination), so this
// also includes a genuine concurrent-write test, not just mocked logic.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-vaccinations";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-vaccinations",
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

function patchVaccination(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/vaccinations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/vaccinations/[id] — conflict detection", () => {
  let vaccinationId: string;

  beforeEach(async () => {
    const vacc = await prisma.farmerVaccination.create({
      data: {
        farmerId: TEST_FARMER_ID,
        animalId: "test-animal-1",
        vaccineName: "Blackleg",
        status: "SCHEDULED",
      },
    });
    vaccinationId = vacc.id;
  });

  afterEach(async () => {
    await prisma.farmerVaccination.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchVaccination(vaccinationId, { status: "COMPLETED" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchVaccination(vaccinationId, { status: "COMPLETED", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchVaccination(vaccinationId, { status: "COMPLETED", expectedVersion: 1 });

    const res = await patchVaccination(vaccinationId, { notes: "given by worker", expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.status).toBe("COMPLETED");
    expect(body.current.version).toBe(2);
  });

  it("under real concurrent writes, exactly one of two same-version PATCHes succeeds", async () => {
    const [a, b] = await Promise.all([
      patchVaccination(vaccinationId, { status: "COMPLETED", expectedVersion: 1 }),
      patchVaccination(vaccinationId, { notes: "logged by a second device", expectedVersion: 1 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = await prisma.farmerVaccination.findUniqueOrThrow({
      where: { id: vaccinationId },
    });
    expect(winner.version).toBe(2);
  });
});
