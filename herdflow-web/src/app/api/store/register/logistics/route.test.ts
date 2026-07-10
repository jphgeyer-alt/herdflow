import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserUpsert, mockLogisticsUpsert } = vi.hoisted(() => ({
  mockUserUpsert: vi.fn(),
  mockLogisticsUpsert: vi.fn(),
}));

const { mockSaveUploadedFile } = vi.hoisted(() => ({
  mockSaveUploadedFile: vi.fn().mockResolvedValue("/uploads/logistics/mock-file.pdf"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: mockUserUpsert,
    },
    logisticsPartner: {
      upsert: mockLogisticsUpsert,
    },
  },
}));

vi.mock("@/lib/server/upload-storage", () => ({
  saveUploadedFile: mockSaveUploadedFile,
}));

import { POST } from "./route";

describe("POST /api/store/register/logistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid fleet size", async () => {
    const form = new FormData();
    form.set("companyName", "Transport Co");
    form.set("contactPhone", "+27870000000");
    form.set("contactEmail", "partner@example.com");
    form.set("fleetSize", "0");
    form.set("routesCovered", "North West");
    form.set("vehicleDocuments", new File(["x"], "doc.pdf", { type: "application/pdf" }));

    const request = new Request("http://localhost/api/store/register/logistics", {
      method: "POST",
      body: form,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockUserUpsert).not.toHaveBeenCalled();
  });

  it("persists logistics profile and returns application ID", async () => {
    mockUserUpsert.mockResolvedValueOnce({ id: "user-2" });
    mockLogisticsUpsert.mockResolvedValueOnce({ id: "log-1" });

    const form = new FormData();
    form.set("companyName", "RouteShift Logistics");
    form.set("contactPhone", "+27879991111");
    form.set("contactEmail", "routes@example.com");
    form.set("password", "StrongPassword123");
    form.set("fleetSize", "12");
    form.set("routesCovered", "North West, Gauteng");
    form.set("vehicleDocuments", new File(["png-content"], "fleet.png", { type: "image/png" }));

    const request = new Request("http://localhost/api/store/register/logistics", {
      method: "POST",
      body: form,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.applicationId).toMatch(/^LOG-/);
    expect(mockUserUpsert).toHaveBeenCalledTimes(1);
    expect(mockLogisticsUpsert).toHaveBeenCalledTimes(1);
  });
});
