import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockListingUpdate,
  mockListingDelete,
  mockProductUpdate,
  mockProductDelete,
  mockGetAdminFromRequest,
} = vi.hoisted(() => ({
  mockListingUpdate: vi.fn(),
  mockListingDelete: vi.fn(),
  mockProductUpdate: vi.fn(),
  mockProductDelete: vi.fn(),
  mockGetAdminFromRequest: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  getAdminFromRequest: mockGetAdminFromRequest,
}));

vi.mock("@/lib/admin-activity", () => ({
  logAdminActivity: vi.fn(),
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

vi.mock("@/lib/tenant-prisma", () => ({
  withAdminContext: (fn: (tx: unknown) => unknown) =>
    fn({
      listing: { update: mockListingUpdate, delete: mockListingDelete },
      product: { update: mockProductUpdate, delete: mockProductDelete },
      orderItem: { deleteMany: vi.fn() },
    }),
}));

import { PATCH } from "./route";

const FAKE_ADMIN = {
  id: "admin-1",
  email: "admin@herdflow.co.za",
  fullName: "Test Admin",
  role: "SUPER_ADMIN" as const,
};

describe("PATCH /api/admin/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without admin cookie", async () => {
    mockGetAdminFromRequest.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "livestock", id: "a", action: "approve" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(401);
  });

  it("approves livestock when authorized", async () => {
    mockGetAdminFromRequest.mockResolvedValueOnce(FAKE_ADMIN);
    mockListingUpdate.mockResolvedValueOnce({ id: "listing-1", title: "Test Listing", status: "ACTIVE" });

    const request = new NextRequest("http://localhost/api/admin/listings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind: "livestock", id: "listing-1", action: "approve" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    expect(mockListingUpdate).toHaveBeenCalledTimes(1);
  });
});
