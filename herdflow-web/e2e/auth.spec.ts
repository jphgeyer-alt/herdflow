import { test, expect } from "@playwright/test";

test.describe("auth pages", () => {
  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /welcome to herdflow/i })).toBeVisible();
    await expect(page.getByPlaceholder("your.email@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("login rejects an unknown account", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("your.email@example.com").fill(`nobody-${Date.now()}@example.com`);
    await page.getByPlaceholder("Enter your password").fill("wrong-password-123");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/login failed|invalid/i)).toBeVisible();
  });

  test("login page links to register and forgot-password", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("link", { name: /create new account/i })).toHaveAttribute(
      "href",
      /\/auth\/register/,
    );
    await expect(page.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});
