"use client";

import { useEffect } from "react";
import type { Locale } from "@/shared/lib/i18n";

/**
 * Keeps <html lang> on the language the server rendered. The pre-paint script sets it on load;
 * after the language switch (a Server Action and a refresh) only this effect runs again.
 */
export function DocumentLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
