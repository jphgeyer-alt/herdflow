import { test, expect } from "@playwright/test";

test.describe("public navigation", () => {
  test("homepage renders with nav and feature links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HerdFlow/i);
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "HerdFlow logo" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Products", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Livestock", exact: true })).toBeVisible();
  });

  test("nav takes visitor from home to shop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Products", exact: true }).click();
    await expect(page).toHaveURL(/\/shop/);
  });

  test("nav takes visitor from home to livestock listings", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Livestock", exact: true }).click();
    await expect(page).toHaveURL(/\/listings/);
  });
});
