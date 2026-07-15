// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml). This is deliberate: the
// conflict-detection guarantee rests on a conditional `updateMany` being
// race-safe under real concurrent writes, which a mocked transaction cannot
// prove. Never run this against a real farm's database — it creates and
// deletes rows scoped to TEST_FARMER_ID only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-camps";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-camps",
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

function patchCamp(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/camps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/camps/[id] — conflict detection", () => {
  let campId: string;

  beforeEach(async () => {
    const camp = await prisma.farmerCamp.create({
      data: { farmerId: TEST_FARMER_ID, name: "Test Camp" },
    });
    campId = camp.id;
  });

  afterEach(async () => {
    await prisma.farmerCamp.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchCamp(campId, { name: "North Camp" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("North Camp");
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchCamp(campId, { name: "North Camp", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("North Camp");
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchCamp(campId, { name: "North Camp", expectedVersion: 1 });

    const res = await patchCamp(campId, { name: "South Camp", expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.name).toBe("North Camp");
    expect(body.current.version).toBe(2);
  });

  it("under real concurrent writes, exactly one of two same-version PATCHes succeeds", async () => {
    const [a, b] = await Promise.all([
      patchCamp(campId, { name: "North Camp", expectedVersion: 1 }),
      patchCamp(campId, { name: "South Camp", expectedVersion: 1 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = await prisma.farmerCamp.findUniqueOrThrow({ where: { id: campId } });
    expect(winner.version).toBe(2);
    expect(["North Camp", "South Camp"]).toContain(winner.name);
  });
});
