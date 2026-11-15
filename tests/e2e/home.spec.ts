import { expect, test } from "@playwright/test";

test("home welcomes and the builder opens a question from tiles", async ({ page, context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hi. Here you investigate the Earth with NASA data.",
    }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "I have a question", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ask$/);

  const builder = page.getByRole("region", { name: "Build your question" });
  await builder.getByRole("radio", { name: /Soil water/i }).click();
  await expect(page).toHaveURL(/\/ask\?depth=simple&theme=soil_water$/);
  await builder.getByRole("radio", { name: /same in two places/ }).click();
  await expect(page).toHaveURL(/verb=comparison/);
  await builder
    .getByRole("group", { name: "First place" })
    .getByRole("radio", { name: /Central Chile/ })
    .click();
  await expect(page).toHaveURL(/a=chile-drying/);
  await builder
    .getByRole("group", { name: "Second place" })
    .getByRole("radio", { name: /Sahel/ })
    .click();

  await expect(builder.getByRole("link", { name: /Investigate/ })).toHaveAttribute(
    "href",
    "/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting&depth=simple",
  );
  await expect(builder.getByRole("link", { name: /^Does soil water change/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("open-data pages stay out of the menu but open by URL", async ({ page, context }) => {
  // The rail menu follows the language cookie; the persisted-data pages are Spanish.
  await context.addCookies([{ name: "etd-lang", value: "es", url: "http://localhost:3000" }]);
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hola. Aquí investigas la Tierra con datos de la NASA.",
    }),
  ).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Menú principal" });
  await expect(menu.getByRole("link", { name: "Inicio" })).toBeVisible();
  for (const name of ["Datos por región", "Pulso del planeta", "Eventos", "Inventario de datos"]) {
    await expect(menu.getByRole("link", { name, exact: true })).toHaveCount(0);
  }

  // The page itself is kept: its content depends on the live API, its heading does not.
  await page.goto("/coverage");
  await expect(page).toHaveURL(/\/coverage$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("coverage filters live in the URL", async ({ page }) => {
  await page.goto("/coverage?q=T2M");

  const table = page.getByRole("table", { name: "Variables persistidas" });
  await expect(table.getByRole("link", { name: "T2M", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue("T2M");
});
