import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createAdminSessionValue } from "@/lib/admin-auth";

const { mockListingUpdate, mockListingDelete, mockProductUpdate, mockProductDelete } = vi.hoisted(() => ({
  mockListingUpdate: vi.fn(),
  mockListingDelete: vi.fn(),
  mockProductUpdate: vi.fn(),
  mockProductDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      update: mockListingUpdate,
      delete: mockListingDelete,
      findMany: vi.fn(),
    },
    product: {
      update: mockProductUpdate,
      delete: mockProductDelete,
      findMany: vi.fn(),
    },
  },
}));

import { PATCH } from "./route";

describe("PATCH /api/admin/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "secret";
    process.env.ADMIN_SESSION_SECRET = "test-secret";
  });

  it("returns 401 without admin cookie", async () => {
    const request = new NextRequest("http://localhost/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "livestock", id: "a", action: "approve" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it("approves livestock when authorized", async () => {
    mockListingUpdate.mockResolvedValueOnce({ id: "listing-1" });
    const session = createAdminSessionValue();

    const request = new NextRequest("http://localhost/api/admin/listings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `hf_admin_session=${session}`,
      },
      body: JSON.stringify({ kind: "livestock", id: "listing-1", action: "approve" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mockListingUpdate).toHaveBeenCalledTimes(1);
  });
});
