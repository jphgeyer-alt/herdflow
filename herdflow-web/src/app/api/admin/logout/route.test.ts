import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

vi.mock("@/lib/admin-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-auth")>("@/lib/admin-auth");
  return {
    ...actual,
    revokeAdminSession: vi.fn(async () => {}),
  };
});

import { POST } from "./route";

describe("POST /api/admin/logout", () => {
  it("clears admin session cookie", async () => {
    const response = await POST();
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") || "";
    expect(setCookie).toContain("hf_admin_session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
