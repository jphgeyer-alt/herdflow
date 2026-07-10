import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockValidateAdminCredentials, mockCreateAdminSession } = vi.hoisted(() => ({
  mockValidateAdminCredentials: vi.fn(),
  mockCreateAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "hf_admin_session",
  SESSION_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12,
    path: "/",
  },
  validateAdminCredentials: mockValidateAdminCredentials,
  createAdminSession: mockCreateAdminSession,
}));

vi.mock("@/lib/admin-activity", () => ({
  logAdminActivity: vi.fn(),
}));

import { POST } from "./route";

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid credentials", async () => {
    mockValidateAdminCredentials.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@herdflow.co.za", password: "wrong" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockCreateAdminSession).not.toHaveBeenCalled();
  });

  it("sets admin session cookie for valid credentials", async () => {
    mockValidateAdminCredentials.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@herdflow.co.za",
      fullName: "Test Admin",
      role: "SUPER_ADMIN",
    });
    mockCreateAdminSession.mockResolvedValueOnce("raw-session-token");

    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@herdflow.co.za", password: "strong-pass" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") || "";
    expect(setCookie).toContain("hf_admin_session=raw-session-token");
    expect(setCookie).toContain("HttpOnly");
  });
});
