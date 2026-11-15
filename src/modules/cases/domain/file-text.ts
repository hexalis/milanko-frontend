import { caseText, type CaseTextField } from "@/modules/copy";
import type { Translator } from "@/shared/lib/i18n";
import {
  EVENT_UNITS,
  isEvent,
  period,
  rankCount,
  relativeChange,
  verdictOf,
  type CaseFile,
  type EventFile,
  type EventVariable,
  type EventVariableReading,
  type TrendCase,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import { formatFigure, unitLabel } from "./format";
import { eventTitle } from "./event-title";

/*
 * Wording of a case file in the reader's language, ported from the POC's app.js helpers
 * (caseVars, changeLabel, fileTitle, evHeadline, evSummary…). Every figure comes from the data.
 */

type TextContext = { translator: Translator; catalog: CaseCatalog };

/** Values the trend narratives quote ({rate}, {total}, {rel}, {from}, {to}, {factor}…). */
export function trendVars(file: TrendCase, { catalog }: Pick<TextContext, "catalog">) {
  const rel = relativeChange(file);
  const { from, to } = period(file.series);
  const vars: Record<string, string | number> = {
    rate: formatFigure(Math.abs(file.t.perDecade), file.digits),
    total: formatFigure(Math.abs(file.t.total), file.digits),
    rel: rel === null ? "" : `${Math.abs(rel).toFixed(0)} %`,
    from,
    to,
    years: file.series.length,
  };
  for (const [key, value] of Object.entries(file.context ?? {})) {
    vars[key] = key === "rainP" && typeof value === "number" ? value.toFixed(2) : value;
  }
  // Temperature cases compare their own rate with the planet-wide NASA POWER sample.
  if (file.variable === "T2M") {
    vars.global = formatFigure(catalog.global.perDecade, 2);
    vars.points = catalog.global.points;
    vars.factor = Math.round(file.t.perDecade / catalog.global.perDecade);
  }
  return vars;
}

export function trendText(
  file: TrendCase,
  field: CaseTextField,
  { translator, catalog }: TextContext,
): string {
  return caseText(translator.locale, file.id, field, trendVars(file, { catalog }));
}

export function fileTitle(file: CaseFile, context: TextContext): string {
  return isEvent(file)
    ? eventTitle(file.title, context.translator.locale)
    : trendText(file, "title", context);
}

/** Short place name for folder tabs and lists. */
export function fileName(file: CaseFile, context: TextContext): string {
  return isEvent(file)
    ? eventTitle(file.title, context.translator.locale)
    : trendText(file, "name", context);
}

/** The headline figure: "+3.5 °C" or "−8 %". */
export function changeLabel(
  file: TrendCase,
  { translator }: Pick<TextContext, "translator">,
): string {
  const rel = relativeChange(file);
  if (rel !== null) return `${rel > 0 ? "+" : "−"}${Math.abs(rel).toFixed(0)} %`;
  return `${formatFigure(file.t.total, file.digits, true)} ${unitLabel(file.unit, translator.locale)}`.trim();
}

export function rateLabel(
  file: TrendCase,
  { translator }: Pick<TextContext, "translator">,
): string {
  return `${formatFigure(file.t.perDecade, file.digits, true)} ${unitLabel(file.unit, translator.locale)}`.trim();
}

export function verdictLabel(
  file: CaseFile,
  { translator }: Pick<TextContext, "translator">,
): string {
  return isEvent(file)
    ? translator.t(`verdict.ev.${file.strength}`)
    : translator.t(`verdict.${verdictOf(file)}`);
}

/** The word beside the evidence bars: "Strong evidence" for trends, "Very unusual" for anomalies. */
export function strengthWord(
  file: CaseFile,
  { translator }: Pick<TextContext, "translator">,
): string {
  return isEvent(file)
    ? translator.t(`unusual.${file.strength}`)
    : translator.t(`strength.${file.t.strength}`);
}

export function themeLabel(theme: string, { translator }: Pick<TextContext, "translator">): string {
  return translator.has(`theme.${theme}`)
    ? translator.t(`theme.${theme}`)
    : translator.t(`cat.${theme}`);
}

/* ---------- Anomaly files ---------- */

/** "Hottest since 1981" or "Hotter than 38 of 45 years". */
export function eventHeadline(
  variable: EventVariable,
  reading: Pick<EventVariableReading, "rank" | "years" | "from">,
  { translator }: Pick<TextContext, "translator">,
): string {
  const count = rankCount(reading);
  if (count.isTop) return translator.t(`ev.rec.hi.${variable}`, { from: reading.from });
  if (count.isBottom) return translator.t(`ev.rec.lo.${variable}`, { from: reading.from });
  return translator.t(`ev.than.${count.isHigh ? "hi" : "lo"}.${variable}`, {
    k: count.k,
    n: count.n,
  });
}

/** Under the short figure on a folder: what "44 of 45 yrs" counts. */
export function eventTail(file: EventFile, context: TextContext): string {
  const count = rankCount(file.lv);
  if (count.isTop || count.isBottom) return eventHeadline(file.lead, file.lv, context);
  return context.translator.t(`ev.tail.${count.isHigh ? "hi" : "lo"}.${file.lead}`, {
    days: context.catalog.eventWindowDays,
  });
}

/** "Record" or "44 of 45". */
export function eventShort(
  reading: Pick<EventVariableReading, "rank" | "years">,
  { translator }: Pick<TextContext, "translator">,
): string {
  const count = rankCount(reading);
  if (count.isTop || count.isBottom) return translator.t("ev.short.record");
  return translator.t("ev.short.of", { k: count.k, n: count.n });
}

/** One-sentence summary of an anomaly file's run-up. */
export function eventSummary(file: EventFile, context: TextContext): string {
  const { translator, catalog } = context;
  const reading = file.lv;
  const count = rankCount(reading);
  const { unit, digits } = EVENT_UNITS[file.lead];
  const comparison = count.isTop
    ? translator.t("ev.cmp.top", { from: reading.from })
    : count.isBottom
      ? translator.t("ev.cmp.bottom", { from: reading.from })
      : translator.t(count.isHigh ? "ev.cmp.hi" : "ev.cmp.lo", { k: count.k, n: count.n });
  return translator.t("ev.sum3", {
    days: catalog.eventWindowDays,
    v: translator.t(`ev.var.${file.lead}`),
    cmp: comparison,
    value: `${formatFigure(reading.value, digits)} ${unit}`.trim(),
    usual: `${formatFigure(reading.mean, digits)} ${unit}`.trim(),
  });
}
