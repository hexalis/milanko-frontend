import { caseTextHaystack, getTranslator } from "@/modules/copy";
import { isEvent, type CaseFile, type EventFile, type TrendCase } from "./case-file";
import { eventTitle } from "./event-title";

/* The archive search over both languages (POC haystack, norm): every term must appear. */

/** Search words a trend theme also answers to, in both languages (POC SYNONYMS). */
const SYNONYMS: Readonly<Record<string, string>> = {
  temperature: "temperature heat warm warming hot air arctic temperatura calor calentamiento aire",
  water:
    "water soil drought dry wet rain rainfall moisture agua suelo sequía seco húmedo lluvia humedad",
  vegetation:
    "vegetation green greening browning forest plants deforestation tundra ndvi vegetación verde bosque plantas deforestación",
};

/** Lower case without accents, so "Japon" finds "Japón" (POC norm). */
export function normalizeSearch(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function searchTerms(q: string): string[] {
  return normalizeSearch(q).split(/\s+/).filter(Boolean);
}

const en = getTranslator("en");
const es = getTranslator("es");
const bothLanguages = (key: string): string[] => [en.t(key), es.t(key)];

function trendHaystack(file: TrendCase): string[] {
  return [
    file.catalog,
    file.variable,
    SYNONYMS[file.theme] ?? "",
    caseTextHaystack(file.id),
    ...bothLanguages(`theme.${file.theme}`),
    ...bothLanguages(`reg.${file.region}`),
    ...bothLanguages(`var.${file.variable}`),
  ];
}

function eventHaystack(file: EventFile): string[] {
  // The Spanish title too: the folder says "Inundación en Japón", so "Japón" must find it.
  return [
    file.catalog,
    file.title,
    eventTitle(file.title, "es"),
    file.source?.id ?? "",
    ...bothLanguages(`cat.${file.category}`),
    ...bothLanguages(`reg.${file.region}`),
    ...bothLanguages(`pt.recent.${file.lead}`),
  ];
}

const haystacks = new WeakMap<CaseFile, string>();

/** Everything a file can be found by, in both languages, normalized. Cached: the data is static. */
function searchHaystack(file: CaseFile): string {
  let haystack = haystacks.get(file);
  if (haystack === undefined) {
    haystack = normalizeSearch(
      (isEvent(file) ? eventHaystack(file) : trendHaystack(file)).join(" "),
    );
    haystacks.set(file, haystack);
  }
  return haystack;
}

/** Every term must appear somewhere in the file's texts. */
export function matchesSearch(file: CaseFile, q: string): boolean {
  const terms = searchTerms(q);
  if (!terms.length) return true;
  const haystack = searchHaystack(file);
  return terms.every((term) => haystack.includes(term));
}
