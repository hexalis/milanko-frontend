import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("archive opens a case file and the language switch translates it", async ({ page }) => {
  await page.goto("/cases?topic=heat");

  await page
    .getByRole("link", { name: /Svalbard is warming/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cases\/svalbard-warming$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Has air temperature changed in Svalbard, Arctic, since 1981?",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "How sure are we?" })).toBeVisible();

  await page.getByText("See each year's numbers").click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(46);

  await page.getByRole("button", { name: "es", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^¿Ha cambiado .* en Svalbard/ }),
  ).toBeVisible();
});

test("a topic button filters the archive", async ({ page }) => {
  await page.goto("/cases");
  await expect(page.getByText("38 case files")).toBeVisible();

  const topics = page.getByRole("navigation", { name: /topic/i });
  await topics.getByRole("link", { name: /Disasters/ }).click();
  await expect(page).toHaveURL(/\/cases\?topic=disasters$/);
  await expect(topics.getByRole("link", { name: /Disasters/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByText("32 case files")).toBeVisible();
  await expect(page.getByRole("link", { name: /Svalbard is warming/ })).toHaveCount(0);
});

test("an audit file opens from the archive at /cases/audit-<category>", async ({ page }) => {
  await page.goto("/cases");
  await page.getByRole("link", { name: /more disasters/ }).click();
  await expect(page).toHaveURL(/\/cases\?kind=audit$/);

  await page.locator('a[href="/cases/audit-wildfires"]').click();
  await expect(page).toHaveURL(/\/cases\/audit-wildfires$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /more and more wildfires/ }),
  ).toBeVisible();
  await expect(page.getByText("More are recorded, not more happen")).toBeVisible();
});

test("an unknown audit category answers 404", async ({ request }) => {
  const response = await request.get("/cases/audit-unicorns");
  expect(response.status()).toBe(404);
});

test("case file CSV downloads the series", async ({ request }) => {
  const response = await request.get("/cases/svalbard-warming/data");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toContain("ETD-2026-001");
  expect(await response.text()).toContain("year,T2M");

  const audit = await request.get("/cases/audit-floods/data");
  expect(audit.status()).toBe(200);
  expect(await audit.text()).toContain("year,events");
});
