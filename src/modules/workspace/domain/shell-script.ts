import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/shared/lib/i18n";
import { NAV_STORAGE_KEY, TABLET_MAX_WIDTH } from "./nav-state";
import { THEME_COLORS, THEME_STORAGE_KEY } from "./theme";

/*
 * Runs in <head> before first paint (POC index.html head scripts), so neither the rail width nor
 * the theme jumps, and <html lang> names the reader's language from the start. It repeats
 * `resolveNavCollapsed`, `resolveTheme` and `resolveDocumentLang` in plain ES5 because it is
 * inlined as text; shell-script.test.ts checks they give the same answers. Every storage access is
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
  try {
    var s = ${JSON.stringify(LOCALES)}, l = null, k = ${JSON.stringify(`${LOCALE_COOKIE}=`)};
    var cs = document.cookie.split(";");
    for (var i = 0; i < cs.length; i++) { var c = cs[i].replace(/^ +/, ""); if (c.indexOf(k) === 0) { l = c.slice(k.length); break; } }
    if (s.indexOf(l) < 0) {
      l = null;
      var n = navigator.languages || [navigator.language || ""];
      for (var j = 0; j < n.length && !l; j++) { var b = String(n[j]).slice(0, 2).toLowerCase(); if (s.indexOf(b) >= 0) l = b; }
    }
    d.setAttribute("lang", l || ${JSON.stringify(DEFAULT_LOCALE)});
  } catch (e) {}
})();`;
