import {
  createTranslator,
  interpolate,
  type Locale,
  type MessageVars,
  type Translator,
} from "@/shared/lib/i18n";
import caseTextData from "./data/case-text.json";
import en from "./data/messages.en.json";
import es from "./data/messages.es.json";

/*
 * Portal copy ported from the POC's i18n.js (998 keys per language, flat dotted keys).
 * Regenerate the JSON from a newer POC rather than editing keys by hand when porting a view.
 */

const CATALOG = { en, es };

export function getTranslator(locale: Locale): Translator {
  return createTranslator(CATALOG, locale);
}

const CASE_FIELDS = ["name", "region", "title", "summary", "why", "limits", "metric"] as const;
export type CaseTextField = (typeof CASE_FIELDS)[number];

type CaseTextEntry = Record<Locale, Record<CaseTextField, string>>;
const CASE_TEXT: Record<string, CaseTextEntry | undefined> = caseTextData;

/**
 * Narrative of a trend case file. Figures in the text ({rate}, {total}, {from}…) come from the data,
 * never from the text itself, so callers pass them in `vars`.
 */
export function caseText(
  locale: Locale,
  id: string,
  field: CaseTextField,
  vars?: MessageVars,
): string {
  const entry = CASE_TEXT[id];
  const template = entry?.[locale]?.[field] ?? entry?.en[field] ?? "";
  return interpolate(template, vars);
}

/** Search haystack for a case: its texts in every language, as the POC searched both. */
export function caseTextHaystack(id: string): string {
  const entry = CASE_TEXT[id];
  if (!entry) return "";
  return Object.values(entry)
    .flatMap((fields) => Object.values(fields))
    .join(" ")
    .toLowerCase();
}
