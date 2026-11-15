import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("a composed question walks the guided steps and keeps the hunch", async ({ page }) => {
  await page.goto("/ask/soil_water@chile-drying?step=4");

  await page
    .getByRole("link", { name: /drier|down|less/i })
    .first()
    .click();
  await expect(page).toHaveURL(/h=down/);
  await page.getByRole("link", { name: /Next/ }).click();
  await expect(page).toHaveURL(/step=5/);
  await expect(page).toHaveURL(/h=down/);
});

test("the comparison shows both reviewed places", async ({ page }) => {
  await page.goto("/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting");

  await expect(
    page.getByRole("heading", { level: 2, name: "Central Chile", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^Sahel/ })).toBeVisible();
});

test("an unknown question is a 404", async ({ request }) => {
  expect((await request.get("/ask/nope")).status()).toBe(404);
});
