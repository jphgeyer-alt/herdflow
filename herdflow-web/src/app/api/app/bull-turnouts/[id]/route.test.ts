// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-bullturnouts";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-bullturnouts",
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

function patchTurnout(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/bull-turnouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/bull-turnouts/[id] — conflict detection", () => {
  let turnoutId: string;

  beforeEach(async () => {
    const turnout = await prisma.farmerBullTurnout.create({
      data: {
        farmerId: TEST_FARMER_ID,
        campId: "test-camp-1",
        campName: "North Camp",
        bullIds: "[]",
        bullTags: "[]",
        dateIn: new Date("2026-01-01"),
        recordedByUserId: "test-user-bullturnouts",
        recordedByName: "Test User",
        recordedByRole: "FARMER",
      },
    });
    turnoutId = turnout.id;
  });

  afterEach(async () => {
    await prisma.farmerBullTurnout.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchTurnout(turnoutId, { dateOut: "2026-02-01" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchTurnout(turnoutId, { dateOut: "2026-02-01", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchTurnout(turnoutId, { dateOut: "2026-02-01", expectedVersion: 1 });

    const res = await patchTurnout(turnoutId, { notes: "removed early", expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.version).toBe(2);
  });
});
