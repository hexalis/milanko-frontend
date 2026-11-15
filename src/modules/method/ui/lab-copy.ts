import { createTranslator, type Locale, type Translator } from "@/shared/lib/i18n";

/*
 * A Translator is a set of functions, so it cannot cross into a client component. The server picks
 * the templates a lab needs; the lab rebuilds a translator from them and fills the figures itself.
 */

export type LabCopy = { locale: Locale; messages: Readonly<Record<string, string>> };

export function pickLabCopy(translator: Translator, keys: readonly string[]): LabCopy {
  return {
    locale: translator.locale,
    // Without vars, t() leaves the {placeholders} in place for the lab to fill.
    messages: Object.fromEntries(keys.map((key) => [key, translator.t(key)])),
  };
}

export function labTranslator({ locale, messages }: LabCopy): Translator {
  return createTranslator({ en: messages, es: messages }, locale);
}

/** Templates of the "make your own planet" lab. */
export const NOISE_LAB_KEYS = [
  "method.play.trend",
  "method.play.noise",
  "method.play.years",
  "method.play.shuffle",
  "method.play.result",
  "method.play.title",
  "unit.decade",
  "verdict.confirmed",
  "verdict.inconclusive",
  "strength.strong",
  "strength.moderate",
  "strength.weak",
  "case.chance",
  "odds.lt1000",
  "odds.n",
  "odds.high",
  "case.chart.inline.series",
  "case.chart.inline.trend",
] as const;

/** Templates of the "peak or record?" lab. */
export const RARE_LAB_KEYS = [
  "method.rare.vars",
  "method.rare.years",
  "method.rare.bar",
  "method.rare.bar.strong",
  "method.rare.bar.record",
  "method.rare.bar.moderate",
  "method.rare.result",
] as const;
