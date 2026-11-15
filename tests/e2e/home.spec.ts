import { expect, test } from "@playwright/test";

test("home links to the persisted-data workspace", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "¿Qué está cambiando en la Tierra, dónde y cuánto?" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Secciones" })
    .getByRole("link", { name: "Inventario" })
    .click();
  await expect(page).toHaveURL(/\/coverage$/);
  await expect(page.getByRole("heading", { name: "Inventario de datos", level: 1 })).toBeVisible();
});

test("coverage filters live in the URL", async ({ page }) => {
  await page.goto("/coverage?q=T2M");

  const table = page.getByRole("table", { name: "Variables persistidas" });
  await expect(table.getByRole("link", { name: "T2M", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar" })).toHaveValue("T2M");
});
