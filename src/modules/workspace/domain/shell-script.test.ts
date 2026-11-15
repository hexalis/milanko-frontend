import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveNavCollapsed } from "./nav-state";
import { SHELL_PREPAINT_SCRIPT } from "./shell-script";
import { resolveTheme, THEME_COLORS } from "./theme";

type Media = { tablet: boolean; dark: boolean };

/** Runs the inline script against this document (jsdom does not execute <script> tags). */
function runScript({ tablet, dark }: Media) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width") ? tablet : query.includes("dark") ? dark : false,
  }));
  // The script is a constant of this repository, never user input.
  new Function(SHELL_PREPAINT_SCRIPT)();
}

const html = () => document.documentElement;
const meta = () => document.querySelector('meta[name="theme-color"]');

beforeEach(() => {
  const tag = document.createElement("meta");
  tag.setAttribute("name", "theme-color");
  tag.setAttribute("content", THEME_COLORS.light);
  document.head.append(tag);
});

afterEach(() => {
  localStorage.clear();
  meta()?.remove();
  html().removeAttribute("data-nav");
  html().removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

describe("resolveTheme", () => {
  it("keeps the reader's pick", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("follows the device without a valid pick", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("sepia", false)).toBe("light");
  });
});

describe("resolveNavCollapsed", () => {
  it("keeps the reader's choice", () => {
    expect(resolveNavCollapsed('{"collapsed":true}', false)).toBe(true);
    expect(resolveNavCollapsed('{"collapsed":false}', true)).toBe(false);
  });

  it("reads an old unpinned save as collapsed", () => {
    expect(resolveNavCollapsed('{"pinned":false}', false)).toBe(true);
  });

  it("starts collapsed on a tablet without a choice", () => {
    expect(resolveNavCollapsed(null, true)).toBe(true);
    expect(resolveNavCollapsed("{broken", false)).toBe(false);
  });
});

describe("SHELL_PREPAINT_SCRIPT", () => {
  const cases: { saved: Record<string, string>; media: Media }[] = [
    { saved: {}, media: { tablet: false, dark: false } },
    { saved: {}, media: { tablet: true, dark: true } },
    {
      saved: { "etd-theme": "light", "etd-nav": '{"collapsed":false}' },
      media: { tablet: true, dark: true },
    },
    {
      saved: { "etd-theme": "dark", "etd-nav": '{"pinned":false}' },
      media: { tablet: false, dark: false },
    },
    { saved: { "etd-theme": "neon", "etd-nav": "{broken" }, media: { tablet: false, dark: true } },
  ];

  it.each(cases)("matches the resolvers for $saved", ({ saved, media }) => {
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
    runScript(media);

    const theme = resolveTheme(saved["etd-theme"] ?? null, media.dark);
    const isCollapsed = resolveNavCollapsed(saved["etd-nav"] ?? null, media.tablet);
    expect(html().dataset.theme).toBe(theme);
    expect(html().dataset.nav).toBe(isCollapsed ? "collapsed" : "open");
    expect(meta()).toHaveAttribute("content", THEME_COLORS[theme]);
  });

  it("still sets a theme when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    runScript({ tablet: false, dark: true });
    expect(html().dataset.theme).toBe("dark");
    expect(html().dataset.nav).toBe("open");
    vi.restoreAllMocks();
  });
});
