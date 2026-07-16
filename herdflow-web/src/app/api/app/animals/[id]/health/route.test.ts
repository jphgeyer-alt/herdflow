// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Regression test for a real production bug: this route looked up the
// animal with a raw `farmerAnimal.findFirst({ id, farmerId })`, but the
// mobile app always addresses animals by their *local* SQLite id in this
// URL (it never learns the server's real cuid back — see
// tenant-lookups.ts). That raw lookup never matched, so every health-event
// POST 404'd and was silently dropped by the mobile sync queue after
// retries — confirmed against production data: 0 FarmerHealthRecord rows
// existed despite 77 real animals.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-health-localid-fallback";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-health-localid",
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

function postHealth(localId: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/app/animals/${localId}/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: localId }) },
  );
}

function getHealth(localId: string) {
  return GET(new Request(`http://localhost/api/app/animals/${localId}/health`), {
    params: Promise.resolve({ id: localId }),
  });
}

describe("POST/GET /api/app/animals/[id]/health — localId fallback", () => {
  const localId = "12345";

  beforeEach(async () => {
    await prisma.farmerAnimal.create({
      data: { farmerId: TEST_FARMER_ID, species: "cattle", localId },
    });
  });

  afterEach(async () => {
    await prisma.farmerAnimal.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerHealthRecord.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("creates a health record when addressed by the animal's local id, not its real cuid", async () => {
    const res = await postHealth(localId, { eventType: "Vaccine", description: "Annual booster" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.eventType).toBe("Vaccine");
  });

  it("lists health records when addressed by the animal's local id", async () => {
    await postHealth(localId, { eventType: "Vaccine" });
    const res = await getHealth(localId);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it("still 404s for an id that matches neither a real animal nor any localId", async () => {
    const res = await postHealth("does-not-exist", { eventType: "Vaccine" });
    expect(res.status).toBe(404);
  });
});
