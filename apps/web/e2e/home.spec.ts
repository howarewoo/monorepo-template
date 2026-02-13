import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Monorepo Template" })).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Next.js")).toBeVisible();
    await expect(page.getByText("Expo")).toBeVisible();
    await expect(page.getByText("Hono + oRPC")).toBeVisible();
  });

  test("should have action buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Documentation" })).toBeVisible();
  });
});
