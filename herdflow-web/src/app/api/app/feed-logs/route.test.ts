// Integration test — runs against a real Postgres (CI's throwaway database,
// see .github/workflows/herdflow-web-ci.yml).
//
// Covers nutrition-item stock deduction: logging a feed entry linked to a
// tracked FarmerNutritionItem (e.g. a salt/mineral lick) must decrement that
// item's quantityInStock by the amount used, clamped at 0 -- mirrors the
// treatments route's medicine-stock deduction.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const TEST_FARMER_ID = "test-farmer-feedlogs-stock";

vi.mock("@/lib/mobile-auth", () => ({
  requireMobileUser: vi.fn(async () => ({
    id: "test-user-feedlogs-stock",
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

function postFeedLog(body: unknown) {
  return POST(
    new Request("http://localhost/api/app/feed-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/app/feed-logs — nutrition item stock deduction", () => {
  let nutritionItemId: string;

  beforeEach(async () => {
    const item = await prisma.farmerNutritionItem.create({
      data: {
        farmerId: TEST_FARMER_ID,
        name: "Voermol Phosphate Block",
        category: "PHOSPHATE_LICK",
        unit: "kg",
        quantityInStock: 100,
      },
    });
    nutritionItemId = item.id;
  });

  afterEach(async () => {
    await prisma.farmerFeedLog.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
    await prisma.farmerNutritionItem.deleteMany({ where: { farmerId: TEST_FARMER_ID } });
  });

  it("deducts the quantity used from the linked item's stock", async () => {
    const res = await postFeedLog({
      campId: "camp-1",
      campName: "North Camp",
      feedType: "Voermol Phosphate Block",
      quantityKg: 25,
      feedDate: "2026-07-22",
      nutritionItemId,
    });
    expect(res.status).toBe(201);

    const item = await prisma.farmerNutritionItem.findUniqueOrThrow({
      where: { id: nutritionItemId },
    });
    expect(Number(item.quantityInStock)).toBe(75);
  });

  it("does not deduct stock for an untracked/ad-hoc feed type (no nutritionItemId)", async () => {
    await postFeedLog({
      campId: "camp-1",
      campName: "North Camp",
      feedType: "Maize Silage",
      quantityKg: 250,
      feedDate: "2026-07-22",
    });

    const item = await prisma.farmerNutritionItem.findUniqueOrThrow({
      where: { id: nutritionItemId },
    });
    expect(Number(item.quantityInStock)).toBe(100);
  });

  it("clamps stock at 0 instead of going negative when usage exceeds what's on hand", async () => {
    const res = await postFeedLog({
      campId: "camp-1",
      campName: "North Camp",
      feedType: "Voermol Phosphate Block",
      quantityKg: 150,
      feedDate: "2026-07-22",
      nutritionItemId,
    });
    expect(res.status).toBe(201);

    const item = await prisma.farmerNutritionItem.findUniqueOrThrow({
      where: { id: nutritionItemId },
    });
    expect(Number(item.quantityInStock)).toBe(0);
  });

  it("does not double-deduct on a retried (idempotent) POST with the same localId", async () => {
    const body = {
      localId: "retry-feedlog-1",
      campId: "camp-1",
      campName: "North Camp",
      feedType: "Voermol Phosphate Block",
      quantityKg: 25,
      feedDate: "2026-07-22",
      nutritionItemId,
    };
    await postFeedLog(body);
    await postFeedLog(body); // retried, e.g. after a flaky network response

    const item = await prisma.farmerNutritionItem.findUniqueOrThrow({
      where: { id: nutritionItemId },
    });
    expect(Number(item.quantityInStock)).toBe(75);
  });
});
