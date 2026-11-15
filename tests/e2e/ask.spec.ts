import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("a composed question checks the hunch and keeps it on the next screen", async ({ page }) => {
  await page.goto("/ask/soil_water@chile-drying?s=guess&depth=simple");

  await page.getByText("It is going down", { exact: true }).click();
  await page.getByRole("button", { name: /Check/ }).click();
  await expect(page).toHaveURL(/s=guess/);
  await expect(page).toHaveURL(/h=down/);
  await expect(page.getByRole("radio", { name: "It is going down" })).toBeChecked();
  await page.getByRole("link", { name: /Continue/ }).click();
  await expect(page).toHaveURL(/s=check/);
  await expect(page).toHaveURL(/h=down/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/real change/);
});

test("an old step link lands on the screen that now holds it", async ({ page }) => {
  await page.goto("/ask/warmer?step=6&depth=simple");

  await expect(page).toHaveURL(/\/ask\/warmer\?s=check&depth=simple$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/real change/);
  await expect(
    page
      .getByRole("list", { name: "Progress of the investigation" })
      .locator("[aria-current=step]"),
  ).toHaveText(/3 \/ 5/);
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
