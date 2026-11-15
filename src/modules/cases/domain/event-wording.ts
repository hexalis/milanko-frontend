import type { Translator } from "@/shared/lib/i18n";
import {
  rankCount,
  type EventFile,
  type EventVariable,
  type EventVariableReading,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import { fileTitle } from "./file-text";

/*
 * Wording of an anomaly file as one reading (POC app.js evNoun, evSaid). The sentence speaks of the
 * event year, never of the other years: "it was hotter than in 44 of the 45 earlier years".
 */

/** «Inundación en Guatemala» → «la inundación en Guatemala»: the event as the object of a question. */
const ARTICLE_ES: Readonly<Record<string, string>> = {
  Inundación: "la",
  Inundaciones: "las",
  Incendio: "el",
  Tormenta: "la",
  Ciclón: "el",
  Supertifón: "el",
  Tifón: "el",
  Huracán: "el",
  Sequía: "la",
  Deslizamiento: "el",
  Terremoto: "el",
  Depresión: "la",
  Iceberg: "el",
};

const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

function nounEs(title: string): string {
  const word = title.split(" ")[0] ?? "";
  if (word === "Volcán") return `la actividad del ${lowerFirst(title)}`;
  const article = ARTICLE_ES[word];
  if (article) return `${article} ${word === "Iceberg" ? title : lowerFirst(title)}`;
  return `el evento «${title}»`;
}

function nounEn(title: string): string {
  if (/^(Wildfire|Flood|Drought|Dust Storm|Landslide|Earthquake) in /.test(title)) {
    return `the ${lowerFirst(title)}`;
  }
  if (/Volcano/.test(title)) return `activity at ${title}`;
  if (/^(Super Typhoon|Typhoon|Tropical|Hurricane|Cyclone|Subtropical)/.test(title)) return title;
  return `the event “${title}”`;
}

export function eventNoun(
  file: EventFile,
  context: { translator: Translator; catalog: CaseCatalog },
): string {
  const title = fileTitle(file, context);
  return context.translator.locale === "es" ? nounEs(title) : nounEn(title);
}

/** One measure of an anomaly file in words, about the event year. */
export function eventSaid(
  variable: EventVariable,
  reading: Pick<EventVariableReading, "rank" | "years" | "from">,
  { t }: Translator,
): string {
  const count = rankCount(reading);
  if (count.isTop) return t(`cf.ev.rec.hi.${variable}`, { from: reading.from });
  if (count.isBottom) return t(`cf.ev.rec.lo.${variable}`, { from: reading.from });
  return t("cf.ev.than", {
    what: t(`cf.ev.${count.isHigh ? "hi" : "lo"}.${variable}`),
    k: count.k,
    n: count.n,
  });
}
