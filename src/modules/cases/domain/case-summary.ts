import type { Translator } from "@/shared/lib/i18n";
import {
  fileDirection,
  fileSeries,
  fileSnr,
  fileStrength,
  fileTheme,
  isEvent,
  period,
  verdictOf,
  type CaseFile,
  type Direction,
  type Point,
  type Verdict,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import {
  changeLabel,
  eventHeadline,
  eventShort,
  eventSummary,
  fileName,
  fileTitle,
  rateLabel,
  strengthWord,
  themeLabel,
  trendText,
  verdictLabel,
} from "./file-text";
import { formatDate } from "./format";
import type { Strength } from "./trend-stats";

/*
 * A case file reduced to the words and figures another view shows about it (the globe explorer's
 * drawer), already in the reader's language. It is plain data, so a Server Component can hand it
 * to a client component without shipping the catalog or the message files.
 */

export type CaseSummary = {
  id: string;
  kind: "trend" | "event";
  /** Catalog number ("ETD-2026-001"). */
  catalog: string;
  /** Sector id (arctic, europe…). */
  region: string;
  lat: number;
  lon: number;
  /** EONET category of an anomaly file. */
  category: string | null;
  title: string;
  /** Short name for list rows. */
  name: string;
  /** "Temperature" or the EONET category. */
  themeLabel: string;
  /** Sprite id of the theme icon. */
  themeIcon: string;
  /** "Svalbard · Arctic" or "Africa · 3 Mar 2025". */
  place: string;
  direction: Direction;
  verdict: Verdict;
  verdictLabel: string;
  strength: Strength;
  strengthWord: string;
  /** Headline figure: "+0.9 °C per decade" or "Hottest since 1981". */
  figure: string;
  /** What the figure measures: "per decade" or "the daily high". */
  figureNote: string;
  /** List row value: "+3.5 °C" or "44 of 45 yrs". */
  short: string;
  /** List row second line: "Air temperature · 1981–2025" or "Wildfires · 3 Mar 2025 · rainfall". */
  rowNote: string;
  summary: string;
  series: Point[];
  /** Sen line of a trend file, for the sparkline. */
  trend: { slope: number; intercept: number } | null;
  /** Signal against noise, to order lists (years of noise, or |z| for anomalies). */
  snr: number;
};

type TextContext = { translator: Translator; catalog: CaseCatalog };

function trendParts(file: Extract<CaseFile, { kind: "trend" }>, context: TextContext) {
  const { t } = context.translator;
  const { from, to } = period(file.series);
  return {
    category: null,
    place: `${fileName(file, context)} · ${t(`reg.${file.region}`)}`,
    figure: rateLabel(file, context),
    figureNote: t("perDecade"),
    short: changeLabel(file, context),
    rowNote: `${t(`var.${file.variable}`)} · ${from}–${to}`,
    summary: trendText(file, "summary", context),
    trend: { slope: file.t.slope, intercept: file.t.intercept },
  };
}

function eventParts(file: Extract<CaseFile, { kind: "event" }>, context: TextContext) {
  const { t, locale } = context.translator;
  const date = formatDate(file.date, locale);
  const variable = t(`ev.var.${file.lead}`);
  return {
    category: file.category,
    place: `${t(`reg.${file.region}`)} · ${date}`,
    figure: eventHeadline(file.lead, file.lv, context),
    figureNote: variable,
    short: eventShort(file.lv, context),
    rowNote: `${t(`cat.${file.category}`)} · ${date} · ${variable}`,
    summary: eventSummary(file, context),
    trend: null,
  };
}

function toCaseSummary(file: CaseFile, context: TextContext): CaseSummary {
  const theme = fileTheme(file);
  return {
    id: file.id,
    kind: file.kind,
    catalog: file.catalog,
    region: file.region,
    lat: file.lat,
    lon: file.lon,
    title: fileTitle(file, context),
    name: fileName(file, context),
    themeLabel: themeLabel(theme, context),
    themeIcon: isEvent(file) ? `ev-${file.family}` : theme,
    direction: fileDirection(file),
    verdict: verdictOf(file),
    verdictLabel: verdictLabel(file, context),
    strength: fileStrength(file),
    strengthWord: strengthWord(file, context),
    series: [...fileSeries(file)],
    snr: fileSnr(file),
    ...(isEvent(file) ? eventParts(file, context) : trendParts(file, context)),
  };
}

/** Every case file of the catalog, summarized in the translator's language. */
export function getCaseSummaries(catalog: CaseCatalog, translator: Translator): CaseSummary[] {
  return catalog.all.map((file) => toCaseSummary(file, { translator, catalog }));
}
