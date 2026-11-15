import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * WCAG 2.2 AA sweep with axe-core on every portal route, in both themes and at a desktop and a
 * phone width. A failure lists each violated rule with the selectors that break it.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

const ROUTES = [
  "/",
  "/ask",
  "/ask/warmer?s=check&depth=science",
  "/cases",
  "/cases/svalbard-warming",
  "/cases/eonet-3073",
  "/cases/audit-wildfires",
  "/briefing",
  "/method",
  "/team",
  "/explore",
  "/regions",
  "/events",
  "/rankings",
  "/coverage",
];

const THEMES = ["light", "dark"] as const;
const WIDTHS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

/** Pages that read the live Milanko API; when it is down they render the error view instead. */
const API_ROUTES = new Set(["/regions", "/events", "/rankings", "/coverage"]);

/** The globe is the POC's own canvas page in a frame; only the page around it is checked here. */
const GLOBE_FRAME = "iframe";

/** No transition or finite animation has run for this long: the page has settled. */
const QUIET_MS = 300;

function countRunningAnimations(page: Page) {
  return page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" &&
            animation.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY,
        ).length,
  );
}

/** Fades pass through low opacity; contrast is measured once nothing has moved for QUIET_MS. */
async function waitForQuiet(page: Page) {
  let quietSince = Date.now();
  await expect
    .poll(
      async () => {
        if (await countRunningAnimations(page)) quietSince = Date.now();
        return Date.now() - quietSince;
      },
      { intervals: [50], timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(QUIET_MS);
}

/**
 * The error view stands in for a page whose data failed; axe must never pass it off as that page.
 * An API page may fail locally when the API is unreachable (skipped); anywhere else, and on CI, it
 * is a failure.
 */
async function guardAgainstErrorView(page: Page, route: string) {
  if (!(await page.getByTestId("error-view").count())) return;
  const reason = `API unreachable: ${route}`;
  if (process.env.CI || !API_ROUTES.has(route)) throw new Error(`Error view instead of ${route}`);
  test.skip(true, reason);
}

async function waitForContent(page: Page, route: string) {
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 30_000 });
  // Suspense fallbacks are busy panels; the sweep reads the streamed page, not the placeholder.
  await expect(page.locator('[aria-busy="true"], output .animate-pulse')).toHaveCount(0, {
    timeout: 30_000,
  });
  await guardAgainstErrorView(page, route);
  await waitForQuiet(page);
}

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.help}\n` +
        violation.nodes
          .map((node) => `    ${node.target.join(" ")}\n      ${node.failureSummary}`)
          .join("\n"),
    )
    .join("\n");
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "etd-lang", value: "en", url: "http://localhost:3000" }]);
});

for (const theme of THEMES) {
  for (const size of WIDTHS) {
    test.describe(`${theme} · ${size.name}`, () => {
      test.use({ viewport: { width: size.width, height: size.height } });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          window.localStorage.setItem("etd-theme", value);
        }, theme);
      });

      for (const route of ROUTES) {
        test(`axe: ${route}`, async ({ page }) => {
          test.setTimeout(90_000);
          // Reduced motion keeps only 120ms fades (globals.css), so settling is quick and stable.
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.goto(route);
          await waitForContent(page, route);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

          const results = await new AxeBuilder({ page })
            .withTags(TAGS)
            .exclude(GLOBE_FRAME)
            .analyze();
          expect(formatViolations(results.violations)).toBe("");
        });
      }
    });
  }
}

test("the document language follows the language cookie", async ({ context, page }) => {
  await context.addCookies([{ name: "etd-lang", value: "es", url: "http://localhost:3000" }]);
  await page.goto("/briefing");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");

  await page.getByRole("button", { name: "en", exact: true }).filter({ visible: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
