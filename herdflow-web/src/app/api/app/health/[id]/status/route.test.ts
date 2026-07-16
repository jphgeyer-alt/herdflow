// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-conflict-detection-health";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-health",
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

function patchStatus(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/app/health/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/app/health/[id]/status — conflict detection", () => {
  let recordId: string;

  beforeEach(async () => {
    const record = await prisma.farmerHealthRecord.create({
      data: {
        farmerId: TEST_FARMER_ID,
        animalId: "test-animal-1",
        eventType: "Check-up",
        eventDate: new Date("2026-01-01"),
        status: "pending",
      },
    });
    recordId = record.id;
  });

  afterEach(async () => {
    await prisma.farmerHealthRecord.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("updates unconditionally when expectedVersion is omitted (backward compatible)", async () => {
    const res = await patchStatus(recordId, { status: "resolved" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("resolved");
    expect(body.version).toBe(1);
  });

  it("applies and increments version when expectedVersion matches", async () => {
    const res = await patchStatus(recordId, { status: "resolved", expectedVersion: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(2);
  });

  it("returns 409 with the current server state when expectedVersion is stale", async () => {
    await patchStatus(recordId, { status: "resolved", expectedVersion: 1 });

    const res = await patchStatus(recordId, { status: "in-treatment", expectedVersion: 1 });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.conflict).toBe(true);
    expect(body.current.status).toBe("resolved");
    expect(body.current.version).toBe(2);
  });

  it("under real concurrent writes, exactly one of two same-version PATCHes succeeds", async () => {
    const [a, b] = await Promise.all([
      patchStatus(recordId, { status: "resolved", expectedVersion: 1 }),
      patchStatus(recordId, { status: "in-treatment", expectedVersion: 1 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = await prisma.farmerHealthRecord.findUniqueOrThrow({ where: { id: recordId } });
    expect(winner.version).toBe(2);
  });
});
