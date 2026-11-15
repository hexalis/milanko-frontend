import { caseText } from "@/modules/copy";
import { isEvent, type CaseFile, type EventFile, type TrendCase } from "./case-file";
import type { AuditCategory } from "./event-audit";
import { formatCoordinates } from "./format";

/*
 * The series behind a case file as CSV (POC downloadCsv and the anomaly file's CSV button):
 * a "#" line with the provenance, a header row and one row per year. The file is always in English.
 */

const TREND_DIGITS = 6;
const SLOPE_DIGITS = 5;
const P_DIGITS = 3;

/** Quotes a field only when it holds a comma, a quote or a line break. */
function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csvLines = (meta: string, rows: (string | number)[][]) =>
  `${[meta, ...rows.map((row) => row.map(csvField).join(","))].join("\n")}\n`;

export function trendCsv(file: TrendCase): string {
  const name = caseText("en", file.id, "name");
  const source = file.source === "modis" ? "MODIS MOD13Q1 (ORNL DAAC)" : "NASA POWER";
  const meta = `# ${file.catalog} ${name} ${formatCoordinates(file.lat, file.lon)} | Sen ${file.t.perDecade.toFixed(SLOPE_DIGITS)} ${file.unit}/decade | Mann-Kendall p=${file.t.p.toExponential(P_DIGITS)} | ${source}`;
  return csvLines(meta, [
    ["year", `${file.variable} (${file.unit})`, "sen_trend"],
    ...file.series.map(([year, value]) => [
      year,
      value,
      (file.t.intercept + file.t.slope * year).toFixed(TREND_DIGITS),
    ]),
  ]);
}

export function eventCsv(file: EventFile, windowDays: number): string {
  const readings = Object.entries(file.vars).flatMap(([variable, reading]) =>
    reading ? [{ variable, reading }] : [],
  );
  const meta = `# ${file.catalog} ${file.eonet} ${file.title} | ${formatCoordinates(file.lat, file.lon)} | first reported ${file.date} | NASA EONET + NASA POWER daily`;
  return csvLines(meta, [
    ["year", ...readings.map(({ variable }) => `${variable}_${windowDays}d_before`)],
    ...file.lv.series.map(([year]) => [
      year,
      ...readings.map(
        ({ reading }) => reading.series.find(([seriesYear]) => seriesYear === year)?.[1] ?? "",
      ),
    ]),
  ]);
}

export function caseCsv(file: CaseFile, windowDays: number): { filename: string; body: string } {
  return isEvent(file)
    ? { filename: `${file.catalog}.csv`, body: eventCsv(file, windowDays) }
    : { filename: `${file.catalog}-${file.id}.csv`, body: trendCsv(file) };
}

/** Events per year of one audit category (POC cfAudit csv). */
export function auditCsv(
  category: Pick<AuditCategory, "id" | "years">,
  generated: string,
): { filename: string; body: string } {
  return {
    filename: `eonet-${category.id}.csv`,
    body: csvLines(`# NASA EONET ${category.id} | events per year | data version ${generated}`, [
      ["year", "events"],
      ...category.years.map(([year, count]) => [year, count]),
    ]),
  };
}
