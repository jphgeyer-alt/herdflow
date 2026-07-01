import { describe, expect, it } from "vitest";
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
