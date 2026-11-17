import type { BuilderState, WhereOption } from "./builder";
import { PLANET, type QuestionType } from "./rules";

/*
 * How the question builder draws its state (POC ask.js askBuilder, the "qb" layout of d2de23a):
 * three steps that are current, done or locked; tiles while the options fit at a glance and a
 * list beyond that; an icon for each option; and what the reader is about to see, said before
 * they press. Every figure of the preview comes from the case files.
 */

/** A step shows its options as tiles up to this many; a longer list stays a dropdown. */
export const TILE_MAX = 8;

export type StepStatus = "current" | "done" | "locked";

export type BuilderSteps = { theme: StepStatus; verb: StepStatus; place: StepStatus };

export function builderSteps(state: BuilderState): BuilderSteps {
  const isPlaceDone =
    state.type === "comparison"
      ? Boolean(state.a && state.b && !state.isSameTwice)
      : Boolean(state.where);
  return {
    theme: state.theme ? "done" : "current",
    verb: !state.theme ? "locked" : state.type ? "done" : "current",
    place: !state.type ? "locked" : isPlaceDone ? "done" : "current",
  };
}

/** Theme families of the fact base, which colour a theme's tile. */
const FAMILIES = ["temperature", "water", "vegetation", "ice", "earth"] as const;
export type Family = (typeof FAMILIES)[number];

export function themeFamily(themes: readonly { id: string; family: string }[], theme: string) {
  const family = themes.find((candidate) => candidate.id === theme)?.family;
  return FAMILIES.find((known) => known === family) ?? "earth";
}

const THEME_ICON: Record<string, string> = {
  temperature: "temperature",
  rain: "rain",
  soil_water: "soil",
  greenness: "vegetation",
  weather: "air",
  events: "ev-storm",
  water_available: "water",
  dangerous_heat: "heat",
  sea_ice: "ev-ice",
  frost: "ev-ice",
  snow: "ev-ice",
  sun_clouds: "contrast",
  days_nights: "calendar",
};

const VERB_ICON: Record<QuestionType, string> = {
  trend: "chart",
  comparison: "decide",
  anomaly: "warning",
  catalog: "table",
};

export const themeIcon = (theme: string) => THEME_ICON[theme] ?? "globe-pin";
export const verbIcon = (type: QuestionType) => VERB_ICON[type];

export function whereIcon(option: WhereOption): string {
  if (option.kind === "place") return "globe-pin";
  if (option.kind === "audit") return "layers";
  if (option.subject.type === "anomaly") return "calendar";
  if (option.kind === "compare") return "decide";
  return "map-pin";
}

export const spotIcon = (place: string) => (place === PLANET ? "explore" : "map-pin");

/** One line of "What you will see": a message key with its values, or a source name as written. */
export type PreviewLine =
  | { icon: string; key: string; values?: Record<string, number> }
  | { icon: string; text: string };

/** The files the preview reads (a CaseCatalog and the event audit fit). */
export type PreviewSources = {
  trends: readonly { id: string; source: string; series: readonly (readonly [number, number])[] }[];
  events: readonly { id: string; vars: Partial<Record<string, { from: number }>> }[];
  eventWindowDays: number;
  audit: { firstYear: number; lastCompleteYear: number };
};

const REVIEWED: PreviewLine = { icon: "check", key: "ask.prev.reviewed" };
/** The POC's fallback when an anomaly file names no first year. */
const ANOMALY_FROM = 1981;

function trendLines(place: string, sources: PreviewSources): PreviewLine[] {
  const trend = sources.trends.find((candidate) => candidate.id === place);
  const first = trend?.series[0];
  const last = trend?.series.at(-1);
  if (!trend || !first || !last) return [REVIEWED];
  const values = { n: trend.series.length, from: first[0], to: last[0] };
  const source = trend.source === "modis" ? "MODIS/Terra · NASA" : "NASA POWER · MERRA-2";
  return [
    { icon: "calendar", key: "ask.prev.years", values },
    { icon: "satellite", text: source },
    REVIEWED,
  ];
}

function whereLines(where: WhereOption, sources: PreviewSources): PreviewLine[] {
  const { subject } = where;
  if (subject.type === "catalog") {
    const { firstYear: from, lastCompleteYear: to } = sources.audit;
    return [{ icon: "audit", key: "ask.prev.audit", values: { from, to } }];
  }
  if (subject.type === "anomaly") {
    const file = sources.events.find((candidate) => candidate.id === subject.event);
    const from = (file && Object.values(file.vars)[0]?.from) ?? ANOMALY_FROM;
    const values = { days: sources.eventWindowDays, from };
    return [{ icon: "calendar", key: "ask.prev.anom", values }, REVIEWED];
  }
  if (subject.type === "trend") return trendLines(subject.place, sources);
  // The reader's own place is read now from NASA and nobody has reviewed it.
  if (subject.type === "point") {
    return [
      { icon: "satellite", text: "NASA POWER · MERRA-2" },
      { icon: "info", key: "ask.prev.live" },
    ];
  }
  return [REVIEWED];
}

/** What the finished question will show; nothing until it can be opened. */
export function previewLines(state: BuilderState, sources: PreviewSources): PreviewLine[] {
  if (!state.go) return [];
  if (state.type === "comparison") return [{ icon: "decide", key: "ask.prev.cmp" }, REVIEWED];
  return state.where ? whereLines(state.where, sources) : [];
}
