/*
 * Light or dark (POC app.js initTheme). The reader's explicit pick is stored; without one the page
 * follows the device. The DS switches its tokens with data-theme on <html>.
 */

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "etd-theme";

/** Browser chrome colour per theme: the brand canvas (globals.css). */
export const THEME_COLORS: Readonly<Record<Theme, string>> = {
  light: "#f5f7fa",
  dark: "#0a0c0f",
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** The stored pick when it is valid, else the device preference. */
export function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
  if (isTheme(saved)) return saved;
  return prefersDark ? "dark" : "light";
}
