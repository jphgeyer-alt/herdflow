import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const originalUsername = process.env.ADMIN_USERNAME;
const originalPassword = process.env.ADMIN_PASSWORD;
const originalSecret = process.env.ADMIN_SESSION_SECRET;

describe("POST /api/admin/login", () => {
  afterEach(() => {
    process.env.ADMIN_USERNAME = originalUsername;
    process.env.ADMIN_PASSWORD = originalPassword;
    process.env.ADMIN_SESSION_SECRET = originalSecret;
  });

  it("rejects invalid credentials", async () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "strong-pass";
    process.env.ADMIN_SESSION_SECRET = "test-secret";

    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("sets admin session cookie for valid credentials", async () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "strong-pass";
    process.env.ADMIN_SESSION_SECRET = "test-secret";

    const request = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "strong-pass" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") || "";
    expect(setCookie).toContain("hf_admin_session=");
    expect(setCookie).toContain("HttpOnly");
  });
});
