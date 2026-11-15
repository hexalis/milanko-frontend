import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("rail keys collapse the menu and search the case files", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/briefing");
  const menu = page.getByRole("navigation", { name: "Main menu" });
  await expect(menu.getByRole("link", { name: "Briefing" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // The button's name says what it will do (no aria-expanded, which would repeat the state).
  await expect(page.getByRole("button", { name: "Collapse menu" })).toBeVisible();
  // The server-rendered rail is visible before hydration attaches the key listener, so retry
  // the key until it lands (pressing only while still open, so a late toggle never undoes it).
  const html = page.locator("html");
  await expect(async () => {
    if ((await html.getAttribute("data-nav")) !== "collapsed") await page.keyboard.press("[");
    await expect(html).toHaveAttribute("data-nav", "collapsed", { timeout: 500 });
  }).toPass();
  await expect(page.getByRole("button", { name: "Expand menu" })).toBeVisible();

  await page.keyboard.press("/");
  await expect(page).toHaveURL(/\/cases\?focus=1$/);
  await expect(page.getByRole("searchbox", { name: /Search/ })).toBeFocused();
});

test("theme pick survives a reload and opening a file feeds Recent", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/cases/svalbard-warming");
  const rail = page.getByRole("banner");

  await rail.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(rail.getByRole("button", { name: "Dark mode" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await expect(rail.getByText("1 of 38 opened")).toBeVisible();
  await expect(rail.getByRole("list", { name: "Recent" }).getByRole("link")).toHaveText(
    /Svalbard is warming/,
  );
});

test("phones get the top bar and the tabbar instead of the rail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cases");

  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeHidden();
  const tabbar = page.getByRole("navigation", { name: "Quick menu" });
  await expect(tabbar.getByRole("link")).toHaveCount(5);
  await expect(tabbar.getByRole("link", { name: "Case Files" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
