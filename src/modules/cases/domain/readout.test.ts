import { describe, expect, it } from "vitest";
import type { EventFile, TrendCase } from "./case-file";
import { getCaseCatalog } from "./catalog";
import {
  anomalyStrips,
  eventWindow,
  percentileBand,
  pPosition,
  trendReadout,
  type TrendReadout,
} from "./readout";
import type { TrendAnalysis } from "./trend-stats";

const catalog = getCaseCatalog();

function trend(id: string): TrendCase {
  const file = catalog.trends.find((candidate) => candidate.id === id);
  if (!file) throw new Error(`missing ${id}`);
  return file;
}

const analysis = (overrides: Partial<TrendAnalysis>): TrendAnalysis => ({
  ...trend("svalbard-warming").t,
  ...overrides,
});

describe("pPosition", () => {
  it("places p on a log track from 1 to 0.0001", () => {
    expect(pPosition(1)).toBe(0);
    expect(pPosition(0.01)).toBe(50);
    expect(pPosition(0.0001)).toBe(100);
    expect(pPosition(1e-9)).toBe(100);
  });
});

describe("trendReadout", () => {
  it("draws a clear upward slope for Svalbard", () => {
    const readout: TrendReadout = trendReadout(trend("svalbard-warming").t);
    expect(readout.direction).toBe("up");
    expect(readout.slope.isClear).toBe(true);
    expect(readout.slope.from).toBeGreaterThan(50);
    expect(readout.slope.mark).toBeGreaterThan(readout.slope.from);
    expect(readout.swing.signal).toBeGreaterThan(readout.swing.noise);
  });

  it("shows an interval that crosses zero for the inconclusive Murray-Darling case", () => {
    const readout = trendReadout(trend("murray-rain").t);
    expect(readout.direction).toBe("flat");
    expect(readout.slope.isClear).toBe(false);
    expect(readout.slope.from).toBeLessThan(50);
    expect(readout.slope.from + readout.slope.width).toBeGreaterThan(50);
    expect(readout.p.mark).toBeLessThan(readout.p.moderate);
  });

  it("quotes the exact p only between 0.001 and 0.05", () => {
    expect(trendReadout(analysis({ p: 0.02 })).p.hasExactFigure).toBe(true);
    expect(trendReadout(analysis({ p: 0.0004 })).p.hasExactFigure).toBe(false);
    expect(trendReadout(analysis({ p: 0.3 })).p.hasExactFigure).toBe(false);
  });

  it("keeps the noise bar visible when the change is smaller than one swing", () => {
    const readout = trendReadout(analysis({ snr: 0.4 }));
    expect(readout.swing.noise).toBeCloseTo(100 / 1.08);
    expect(readout.swing.signal).toBeLessThan(readout.swing.noise);
  });

  it("does not divide by zero on a flat slope", () => {
    const readout = trendReadout(analysis({ slope: 0, slopeLow: 0, slopeHigh: 0 }));
    expect(readout.slope.mark).toBe(50);
    expect(readout.slope.width).toBe(0);
  });
});

describe("percentileBand", () => {
  it.each([
    [95, "very-high"],
    [80, "high"],
    [50, "usual"],
    [20, "low"],
    [5, "very-low"],
  ] as const)("percentile %i reads %s", (percentile, band) => {
    expect(percentileBand(percentile)).toBe(band);
  });
});

describe("anomalyStrips", () => {
  const file = catalog.events[0] as EventFile;

  it("draws one strip per variable, the lead first-class", () => {
    const strips = anomalyStrips(file);
    expect(strips.map((strip) => strip.variable)).toEqual(Object.keys(file.vars));
    expect(strips.filter((strip) => strip.isLead).map((strip) => strip.variable)).toEqual([
      file.lead,
    ]);
  });

  it("leaves the event year out of the dots and keeps every position on the track", () => {
    const year = Number(file.date.slice(0, 4));
    for (const strip of anomalyStrips(file)) {
      expect(strip.years.some((dot) => dot.year === year)).toBe(false);
      for (const dot of strip.years) {
        expect(dot.position).toBeGreaterThanOrEqual(0);
        expect(dot.position).toBeLessThanOrEqual(100);
      }
      expect(strip.valuePosition).toBeGreaterThanOrEqual(0);
      expect(strip.valuePosition).toBeLessThanOrEqual(100);
    }
  });
});

describe("eventWindow", () => {
  it("ends the day before the event and spans the window", () => {
    expect(eventWindow({ date: "2017-07-08" }, 90)).toEqual({
      start: "2017-04-09",
      end: "2017-07-07",
    });
  });

  it("crosses a year boundary", () => {
    expect(eventWindow({ date: "2020-01-01" }, 90).end).toBe("2019-12-31");
  });
});
