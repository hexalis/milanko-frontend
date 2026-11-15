import casesData from "../data/cases.json";
import eventFilesData from "../data/event-files.json";
import globalData from "../data/global.json";
import {
  toEventFile,
  toTrendCase,
  type CaseFile,
  type EventFile,
  type EventFileRecord,
  type TrendCase,
  type TrendCaseRecord,
} from "./case-file";

/*
 * The 6 trend cases and 32 anomaly files are a snapshot built by the POC's scripts
 * (build_cases.py, build_event_files.py); they ship with the app, so every file page can be prerendered.
 */

export type CaseCatalog = {
  trends: TrendCase[];
  events: EventFile[];
  all: CaseFile[];
  /** Days of the anomaly run-up window (90). */
  eventWindowDays: number;
  /** Planet-wide NASA POWER sample the temperature cases compare against. */
  global: {
    variable: string;
    points: number;
    perDecade: number;
    p: number;
    /** Change over the whole sample, in the variable's unit. */
    total: number;
    years: number;
    from: number;
    to: number;
  };
  /** When the build scripts produced cases.json (shown as the data version). */
  generated: string;
  /** When the build scripts produced event-files.json. */
  eventsGenerated: string;
};

function buildCatalog(): CaseCatalog {
  const trends = (casesData.cases as unknown as TrendCaseRecord[]).flatMap((record) => {
    const file = toTrendCase(record);
    return file ? [file] : [];
  });
  // JSON imports widen [year, value] tuples to number[]; the build script guarantees the shape.
  const events = (eventFilesData.files as unknown as EventFileRecord[]).flatMap((record) => {
    const file = toEventFile(record);
    return file ? [file] : [];
  });
  return {
    trends,
    events,
    all: [...trends, ...events],
    eventWindowDays: eventFilesData.window,
    global: {
      variable: globalData.variable,
      points: globalData.points,
      perDecade: globalData.trend.perDecade,
      p: globalData.trend.p,
      total: globalData.trend.total,
      years: globalData.series.length,
      from: globalData.from,
      to: globalData.to,
    },
    generated: casesData.generated,
    eventsGenerated: eventFilesData.generated,
  };
}

let catalog: CaseCatalog | undefined;

/** Built once per server process; the data is static. */
export function getCaseCatalog(): CaseCatalog {
  catalog ??= buildCatalog();
  return catalog;
}

export function findCaseFile(id: string): CaseFile | undefined {
  return getCaseCatalog().all.find((file) => file.id === id);
}
