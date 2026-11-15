export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/** The portal is in English by default (NASA Space Apps submission); Spanish is a switch. */
export const DEFAULT_LOCALE: Locale = "en";

/** Same name the POC used in localStorage, now a cookie so the server can render the right language. */
export const LOCALE_COOKIE = "etd-lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export type MessageVars = Record<string, string | number | undefined>;

/** Fills `{name}` placeholders; unknown placeholders stay as written, like the POC. */
export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export type Messages = Readonly<Record<string, string>>;

export type Translator = {
  locale: Locale;
  t: (key: string, vars?: MessageVars) => string;
  /** True when the key exists in the default language (the POC tested STRINGS.en). */
  has: (key: string) => boolean;
};

/** Looks a key up in the locale, then in English, then returns the key itself. */
export function createTranslator(catalog: Record<Locale, Messages>, locale: Locale): Translator {
  const primary = catalog[locale];
  const fallback = catalog[DEFAULT_LOCALE];
  return {
    locale,
    t: (key, vars) => interpolate(primary[key] ?? fallback[key] ?? key, vars),
    has: (key) => key in fallback,
  };
}
