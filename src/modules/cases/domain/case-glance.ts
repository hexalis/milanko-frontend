import { caseText } from "@/modules/copy";
import type { Translator } from "@/shared/lib/i18n";
import {
  fileDirection,
  fileSeries,
  fileStrength,
  isEvent,
  period,
  verdictOf,
  type CaseFile,
} from "./case-file";
import type { CaseCatalog } from "./catalog";
import {
  SHEET_COUNT,
  type ReadingContext,
  type ReadingGlance,
  type ReadingSheet,
} from "./case-reading";
import { changeLabel, eventShort, fileName, verdictLabel } from "./file-text";
import { formatFigure, formatP } from "./format";
import { SIGNIFICANCE, STRONG_EVIDENCE, type Strength } from "./trend-stats";

/*
 * The glance of a trend or anomaly file: the same sheets its archive folder carries (one per level
 * of evidence), each with one plain sentence on what its figure means, the same verdict stamp,
 * the point on the map and what it means where it happened.
 */

const PER_HUNDRED = 100;

/** A p-value in words: how often chance alone would give a change like this one. */
export function chanceNote({ t }: Translator, p: number): string {
  const times = Math.round(p * PER_HUNDRED);
  const chance = times < 1 ? t("cf.sheet.chance.lt") : t("cf.sheet.chance.k", { k: times });
  return t("cf.sheet.test.note", { chance });
}

/** The two bars a trend test is held to; clearing each one adds a sheet to the file. */
export function pChecks({ t }: Translator, p: number): { label: string; isPassed: boolean }[] {
  return [
    { label: t("cf.sheet.check.usual"), isPassed: p < SIGNIFICANCE },
    { label: t("cf.sheet.check.strict"), isPassed: p < STRONG_EVIDENCE },
  ];
}

/** Why a weaker file carries fewer sheets, in the terms of its own test. */
export function missingNote({ t }: Translator, level: Strength, kind: string): string | null {
  const missing = 3 - SHEET_COUNT[level];
  return missing > 0 ? t(`cf.sheet.missing.${kind}.${missing}`) : null;
}

/** The sheets a trend or anomaly file carries, one per level of evidence, as the folder and the glance draw them. */
export function fileSheets(
  file: CaseFile,
  translator: Translator,
  catalog: CaseCatalog,
): ReadingSheet[] {
  const { t } = translator;
  const text = { translator, catalog };
  const series = fileSeries(file);
  const { from, to } = period(series);
  const sheets: ReadingSheet[] = isEvent(file)
    ? [
        {
          label: t("sheet.runup", { days: catalog.eventWindowDays }),
          value: eventShort(file.lv, text),
          note: t("cf.sheet.runup.note", { days: catalog.eventWindowDays, n: file.lv.years }),
        },
        {
          label: t("sheet.test"),
          value: t("sheet.test.ev", { z: formatFigure(file.lv.z, 1, true), n: file.lv.years - 1 }),
          note: t("cf.sheet.test.ev.note", { rank: file.lv.rank, n: file.lv.years }),
        },
        { label: t("sheet.source"), value: "EONET · POWER", note: t("cf.sheet.source.eonet") },
      ]
    : [
        {
          label: t("sheet.series"),
          value: changeLabel(file, text),
          note: t("cf.sheet.series.note", { n: series.length, from, to }),
        },
        {
          label: t("sheet.test"),
          value: `p ${formatP(file.t.p)}`,
          note: chanceNote(translator, file.t.p),
          checks: pChecks(translator, file.t.p),
        },
        {
          label: t("sheet.source"),
          value: file.source === "modis" ? "MODIS/Terra" : "NASA POWER",
          note: t(`cf.sheet.source.${file.source === "modis" ? "modis" : "power"}`),
        },
      ];
  return sheets.slice(0, SHEET_COUNT[fileStrength(file)]);
}

export function fileGlance(
  file: CaseFile,
  ctx: ReadingContext,
  globe: ReadingGlance["globe"],
): ReadingGlance {
  const { translator } = ctx;
  const { t, locale } = translator;
  const text = { translator, catalog: ctx.catalog };
  const series = fileSeries(file);
  const level = fileStrength(file);
  return {
    place: {
      lat: file.lat,
      lon: file.lon,
      label: isEvent(file) ? t(`reg.${file.region}`) : fileName(file, text),
    },
    globe,
    sheets: fileSheets(file, translator, ctx.catalog),
    missing: missingNote(translator, level, isEvent(file) ? "ev" : "trend"),
    spark: {
      series,
      trend: isEvent(file) ? null : file.t,
      direction: fileDirection(file),
      isLastMarked: isEvent(file),
    },
    verdict: verdictOf(file),
    verdictLabel: verdictLabel(file, text),
    impact: isEvent(file) ? t(`cf.impact.ev.${file.family}`) : caseText(locale, file.id, "impact"),
  };
}
