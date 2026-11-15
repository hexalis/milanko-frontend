import { expect, test } from "@playwright/test";

test("archive opens a case file and the language switch translates it", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
  await page.goto("/cases?kind=trend");

  await page
    .getByRole("link", { name: /Svalbard is warming/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cases\/svalbard-warming$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Svalbard is warming about \d+ times faster/ }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Table" }).click();
  await expect(page.getByRole("tabpanel").getByRole("row")).toHaveCount(46);

  await page.getByRole("button", { name: "es" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Svalbard se calienta/ })).toBeVisible();
});

test("case file CSV downloads the series", async ({ request }) => {
  const response = await request.get("/cases/svalbard-warming/data");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toContain("ETD-2026-001");
  expect(await response.text()).toContain("year,T2M");
});
