import { expect, test } from "@playwright/test";

test("home page renders the live price board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /The night, priced live/i })).toBeVisible();
  await expect(page.getByText(/Live price board/i)).toBeVisible();
});

test("club page lists entry passes and pick-your-night dates", async ({ page }) => {
  await page.goto("/mumbai/clubs/kitty-su");
  await expect(page.getByRole("heading", { name: /Kitty Su/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Pick your night/i })).toBeVisible();
});

test("legal pages exist for DPDP compliance", async ({ page }) => {
  for (const slug of ["terms", "privacy", "refunds", "cookies", "partner-terms", "grievance"]) {
    await page.goto(`/legal/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
  }
});
