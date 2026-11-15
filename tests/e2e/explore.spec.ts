import { expect, test } from "@playwright/test";

// The globe draws with WebGL. With software rendering it keeps the page's main thread so busy that
// navigations take many seconds, so these tests ask for the GPU and allow for slow machines.
test.use({
  launchOptions: {
    args: [
      "--ignore-gpu-blocklist",
      "--enable-gpu",
      ...(process.platform === "win32" ? ["--use-angle=d3d11"] : []),
    ],
  },
  reducedMotion: "reduce",
});
test.setTimeout(180_000);

const SLOW = { timeout: 60_000 };

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

test("the globe page and the data it loads are served, with CORS for its sandbox", async ({
  request,
}) => {
  for (const path of [
    "/globe/world3d/index.html",
    "/globe/world3d/grid.js",
    "/globe/api.js",
    "/globe/icons.svg",
    "/globe/data/world/meta.json",
    "/globe/data/cases.json",
    "/globe/data/events/2025.json",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["access-control-allow-origin"], path).toBe("*");
  }
});

test("picking a region on the globe opens its drawer and keeps it in the URL", async ({ page }) => {
  await page.goto("/explore");
  const europe = page
    .frameLocator('iframe[title^="Global explorer"]')
    .locator('[data-region="europe"]');
  await europe.waitFor(SLOW);

  await europe.evaluate((button: HTMLElement) => button.click());
  await expect(page).toHaveURL(/\/explore\?region=europe$/, SLOW);
  const drawer = page.getByRole("complementary", { name: "Europe" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: /Open in Case Files/ })).toHaveAttribute(
    "href",
    "/cases?region=europe",
  );

  await drawer
    .getByRole("button", { name: /^See on the globe/ })
    .first()
    .click();
  await expect(page).toHaveURL(/region=europe&case=/, SLOW);
  await expect(
    page.getByRole("complementary").getByRole("link", { name: /View case file/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(page).toHaveURL(/\/explore$/, SLOW);
  await expect(page.getByRole("complementary")).toHaveCount(0);
});

test("a link to a case file opens its drawer", async ({ page }) => {
  await page.goto("/explore?case=svalbard-warming");
  const drawer = page.getByRole("complementary", { name: /Svalbard is warming/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: /View case file/ })).toHaveAttribute(
    "href",
    "/cases/svalbard-warming",
  );
});
