import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/shared/lib/i18n";

/** The language cookie wins; on a first visit, the browser's preferred language; else English. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accepted = (await headers()).get("accept-language") ?? "";
  const preferred = accepted
    .split(",")
    .map((part) => part.trim().slice(0, 2).toLowerCase())
    .find((code) => (LOCALES as readonly string[]).includes(code));
  return isLocale(preferred) ? preferred : DEFAULT_LOCALE;
}
