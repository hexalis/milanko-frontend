import {
  trendDirection,
  type Direction,
  type EventFile,
  type EventVariable,
  type EventVariableReading,
} from "./case-file";
import type { TrendAnalysis } from "./trend-stats";

/*
 * Geometry of the appendix readout (POC app.js trendReadout / anomalyReadout): every position is a
 * percentage of its track, so the UI only places marks. The figures come from the file itself.
 */

/** The two lines of evidence on the p track. */
const P_LINES = { moderate: 0.05, strong: 0.01 } as const;

/** Rightmost end of the p track (0.0001). */
const P_FLOOR = 1e-4;
const P_DECADES = 4;
/** Below this, p is written "< 0.001" and has no exact figure worth quoting. */
const P_EXACT_FLOOR = 0.001;
/** Room left around the widest end of the slope interval. */
const SLOPE_AXIS_PADDING = 1.15;
/** Room left after the longer of the two swing bars. */
const SWING_PADDING = 1.08;
const DECADE = 10;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

/** Position (0–100) of a p-value on a log track from 1 (left) to 0.0001 (right). */
export function pPosition(p: number): number {
  return clampPercent((-Math.log10(Math.max(p, P_FLOOR)) / P_DECADES) * 100);
}

export type TrendReadout = {
  direction: Direction;
  /** How sure: the case's mark and the two evidence lines on the log track. */
  p: { mark: number; moderate: number; strong: number; hasExactFigure: boolean };
  /** How big: Sen slope per decade and its 95 % interval, on an axis centered on zero (50 %). */
  slope: {
    low: number;
    high: number;
    mid: number;
    from: number;
    width: number;
    mark: number;
    /** The interval stays on one side of zero. */
    isClear: boolean;
  };
  /** Bigger than the swing: the whole change against one year-to-year swing, as bar widths. */
  swing: { signal: number; noise: number };
};

export function trendReadout(t: TrendAnalysis): TrendReadout {
  const low = t.slopeLow * DECADE;
  const high = t.slopeHigh * DECADE;
  const mid = t.slope * DECADE;
  const span = Math.max(Math.abs(low), Math.abs(high), Math.abs(mid)) * SLOPE_AXIS_PADDING || 1;
  const onAxis = (value: number) => 50 + (value / span) * 50;
  const top = Math.max(t.snr, 1) * SWING_PADDING;
  return {
    direction: trendDirection(t),
    p: {
      mark: pPosition(t.p),
      moderate: pPosition(P_LINES.moderate),
      strong: pPosition(P_LINES.strong),
      hasExactFigure: t.p >= P_EXACT_FLOOR && t.p < P_LINES.moderate,
    },
    slope: {
      low,
      high,
      mid,
      from: onAxis(low),
      width: onAxis(high) - onAxis(low),
      mark: onAxis(mid),
      isClear: low > 0 || high < 0,
    },
    swing: { signal: (t.snr / top) * 100, noise: (1 / top) * 100 },
  };
}

/* ---------- Anomaly files ---------- */

export type PercentileBand = "very-high" | "high" | "usual" | "low" | "very-low";

export function percentileBand(percentile: number): PercentileBand {
  if (percentile >= 90) return "very-high";
  if (percentile >= 75) return "high";
  if (percentile <= 10) return "very-low";
  if (percentile <= 25) return "low";
  return "usual";
}

export const eventYear = (file: Pick<EventFile, "date">): number => Number(file.date.slice(0, 4));

export type AnomalyStrip = {
  variable: EventVariable;
  reading: EventVariableReading;
  isLead: boolean;
  min: number;
  max: number;
  /** Every earlier year as a dot. */
  years: { year: number; value: number; position: number }[];
  meanPosition: number;
  valuePosition: number;
  band: PercentileBand;
};

/** One strip per variable: the event year against the same window in every earlier year. */
export function anomalyStrips(file: EventFile): AnomalyStrip[] {
  const year = eventYear(file);
  return (Object.entries(file.vars) as [EventVariable, EventVariableReading | undefined][]).flatMap(
    ([variable, reading]) => {
      if (!reading) return [];
      const values = reading.series.map(([, value]) => value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const position = (value: number) => (max > min ? ((value - min) / (max - min)) * 100 : 50);
      return [
        {
          variable,
          reading,
          isLead: variable === file.lead,
          min,
          max,
          years: reading.series
            .filter(([seriesYear]) => seriesYear !== year)
            .map(([seriesYear, value]) => ({ year: seriesYear, value, position: position(value) })),
          meanPosition: position(reading.mean),
          valuePosition: position(reading.value),
          band: percentileBand(reading.percentile),
        },
      ];
    },
  );
}

const DAY_MS = 864e5;

function shiftDay(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The run-up window: the `days` days that end the day before the event was first reported. */
export function eventWindow(file: Pick<EventFile, "date">, days: number) {
  return { start: shiftDay(file.date, -days), end: shiftDay(file.date, -1) };
}
