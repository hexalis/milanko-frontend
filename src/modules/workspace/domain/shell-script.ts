import { NAV_STORAGE_KEY, TABLET_MAX_WIDTH } from "./nav-state";
import { THEME_COLORS, THEME_STORAGE_KEY } from "./theme";

/*
 * Runs in <head> before first paint (POC index.html head scripts), so neither the rail width nor
 * the theme jumps. It repeats `resolveNavCollapsed` and `resolveTheme` in plain ES5 because it is
 * inlined as text; shell-script.test.ts checks both give the same answers. Every storage access is
 * guarded: private modes and blocked storage throw.
 */
export const SHELL_PREPAINT_SCRIPT = `(function () {
  var d = document.documentElement;
  try {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(${JSON.stringify(NAV_STORAGE_KEY)}) || "null"); } catch (e) {}
    var c = p && typeof p === "object" ? p.collapsed === true || p.pinned === false
      : matchMedia("(max-width: ${TABLET_MAX_WIDTH}px)").matches;
    d.setAttribute("data-nav", c ? "collapsed" : "open");
  } catch (e) {}
  try {
    var t = null;
    try { t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch (e) {}
    if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    d.setAttribute("data-theme", t);
    // The script owns this tag: rendered by React, it would not match after this change and
    // hydration would append a second one.
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "theme-color"); document.head.appendChild(m); }
    m.setAttribute("content", t === "dark" ? ${JSON.stringify(THEME_COLORS.dark)} : ${JSON.stringify(THEME_COLORS.light)});
  } catch (e) {}
})();`;
