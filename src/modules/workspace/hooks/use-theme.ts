"use client";

import { useCallback, useEffect } from "react";
import {
  isTheme,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Theme,
} from "../domain/theme";
import { useThemeAttribute } from "./use-html-attribute";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function savedTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

/**
 * The current theme (`null` until mounted) and a setter that stores the reader's explicit pick.
 * Until the reader picks, the page follows the device when its preference changes.
 */
export function useTheme(): { theme: Theme | null; setTheme: (theme: Theme) => void } {
  const attribute = useThemeAttribute();

  useEffect(() => {
    const media = matchMedia(DARK_QUERY);
    const follow = () => {
      if (!isTheme(savedTheme())) applyTheme(resolveTheme(null, media.matches));
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage is blocked: the choice lasts this visit.
    }
    applyTheme(theme);
  }, []);

  return { theme: isTheme(attribute) ? attribute : null, setTheme };
}
