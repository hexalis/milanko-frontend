import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/shared/lib/i18n";

/*
 * The language of <html> (WCAG 3.1.1). The server picks it from the language cookie, else the
 * browser's preferred language (server/locale.ts); the pre-paint script repeats that pick from
 * document.cookie and navigator.languages, so the document is never announced in the wrong one.
 */

/** Value of the language cookie in a `document.cookie` string, or null. */
export function readLocaleCookie(cookie: string): string | null {
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === LOCALE_COOKIE) return value.join("=");
  }
  return null;
}

/** The cookie's language when valid, else the first supported browser language, else English. */
export function resolveDocumentLang(cookie: string, languages: readonly string[]): Locale {
  const saved = readLocaleCookie(cookie);
  if (isLocale(saved)) return saved;
  const preferred = languages
    .map((language) => language.slice(0, 2).toLowerCase())
    .find((code) => (LOCALES as readonly string[]).includes(code));
  return isLocale(preferred) ? preferred : DEFAULT_LOCALE;
}
