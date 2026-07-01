import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockContactCreate } = vi.hoisted(() => ({
  mockContactCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contactInquiry: {
      create: mockContactCreate,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/store/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid email", async () => {
    const request = new Request("http://localhost/api/store/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User",
        email: "bad-email",
        subject: "Hello",
        message: "This message is long enough.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("valid email");
    expect(mockContactCreate).not.toHaveBeenCalled();
  });

  it("creates inquiry and returns reference", async () => {
    mockContactCreate.mockResolvedValueOnce({ id: "contact-1" });

    const request = new Request("http://localhost/api/store/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "+27870000000",
        subject: "Partnership",
        message: "We want to discuss a regional trade partnership.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.inquiryId).toMatch(/^INQ-/);
    expect(mockContactCreate).toHaveBeenCalledTimes(1);
  });
});
