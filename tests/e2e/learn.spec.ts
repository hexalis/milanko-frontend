import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("briefing leads to the featured case file and the archive", async ({ page }) => {
  await page.goto("/briefing");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#suspect-title")).toContainText("12");
  await page.getByRole("link", { name: "Open Case Files" }).click();
  await expect(page).toHaveURL(/\/cases$/);
});

test("the planet lab redraws its verdict when the trend changes", async ({ page }) => {
  await page.goto("/method");
  // The sliders are React Aria client components: wait for hydration before using the keyboard.
  await page.waitForLoadState("networkidle");

  const trend = page.locator('input[type="range"]').nth(2);
  const lab = trend.locator("xpath=ancestor::section[1]");
  await expect(lab).toContainText("Sen +0.30");
  await trend.focus();
  await page.keyboard.press("Home");
  await expect(lab).toContainText("Sen −1.00");
});
