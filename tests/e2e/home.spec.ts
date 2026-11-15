import { expect, test } from "@playwright/test";

test("home builds a question and opens it", async ({ page, context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "What do you want to find out?" }),
  ).toBeVisible();
  const builder = page.getByRole("region", { name: "Build your question" });
  await builder.getByRole("combobox", { name: /About what/ }).selectOption("soil_water");
  await expect(page).toHaveURL(/\/\?depth=simple&theme=soil_water$/);
  await builder.getByRole("combobox", { name: /What to find out/ }).selectOption("comparison");
  await builder.getByRole("combobox", { name: /First place/ }).selectOption("chile-drying");
  await builder.getByRole("combobox", { name: /Second place/ }).selectOption("sahel-wetting");

  await expect(builder.getByRole("link", { name: /Investigate/ })).toHaveAttribute(
    "href",
    "/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting&depth=simple",
  );
  await expect(builder.getByRole("link", { name: /^Does soil water change/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("home menu links to the persisted-data workspace", async ({ page, context }) => {
  // The menu follows the language cookie; the persisted-data pages are Spanish.
  await context.addCookies([{ name: "etd-lang", value: "es", url: "http://localhost:3000" }]);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "¿Qué quieres averiguar?" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Menú principal" })
    .getByRole("link", { name: "Inventario de datos" })
    .click();
  await expect(page).toHaveURL(/\/coverage$/);
  // The page content depends on the live API; the menu marks the section either way.
  await expect(
    page
      .getByRole("navigation", { name: "Menú principal" })
      .getByRole("link", { name: "Inventario de datos" }),
  ).toHaveAttribute("aria-current", "page");
});

test("coverage filters live in the URL", async ({ page }) => {
  await page.goto("/coverage?q=T2M");

  const table = page.getByRole("table", { name: "Variables persistidas" });
  await expect(table.getByRole("link", { name: "T2M", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue("T2M");
});
