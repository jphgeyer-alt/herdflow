import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserUpsert, mockSellerUpsert } = vi.hoisted(() => ({
  mockUserUpsert: vi.fn(),
  mockSellerUpsert: vi.fn(),
}));

const { mockSaveUploadedFile } = vi.hoisted(() => ({
  mockSaveUploadedFile: vi.fn().mockResolvedValue("/uploads/seller/mock-file.pdf"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: mockUserUpsert,
    },
    seller: {
      upsert: mockSellerUpsert,
    },
  },
}));

vi.mock("@/lib/server/upload-storage", () => ({
  saveUploadedFile: mockSaveUploadedFile,
}));

import { POST } from "./route";

describe("POST /api/store/register/seller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const form = new FormData();
    form.set("farmName", "");

    const request = new Request("http://localhost/api/store/register/seller", {
      method: "POST",
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("persists seller profile and returns application ID", async () => {
    mockUserUpsert.mockResolvedValueOnce({ id: "user-1" });
    mockSellerUpsert.mockResolvedValueOnce({ id: "seller-1" });

    const form = new FormData();
    form.set("farmName", "Molapo Farms");
    form.set("location", "Lichtenburg");
    form.set("region", "North West");
    form.set("contactPhone", "+27820001111");
    form.set("contactEmail", "seller@example.com");
    form.set("nationalIdNumber", "9001015009087");
    form.set("idDocument", new File(["pdf-content"], "id.pdf", { type: "application/pdf" }));

    const request = new Request("http://localhost/api/store/register/seller", {
      method: "POST",
      body: form,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.applicationId).toMatch(/^SELL-/);
    expect(mockUserUpsert).toHaveBeenCalledTimes(1);
    expect(mockSellerUpsert).toHaveBeenCalledTimes(1);
  });
});
