import { describe, expect, it } from "vitest";
import type { Point } from "@/modules/cases";
import {
  editSeries,
  initialEdit,
  isUnchanged,
  niceStep,
  playgroundLimits,
  readSeries,
} from "./playground";

/* A gentle rise with a fixed wobble: 30 years, +0.3 a decade. */
const SERIES: Point[] = Array.from({ length: 30 }, (_, index): Point => [
  1996 + index,
  10 + 0.03 * index + (index % 3 === 0 ? 0.2 : index % 3 === 1 ? -0.15 : -0.05),
]);

describe("niceStep", () => {
  it("rounds down to 1, 2 or 5 times a power of ten", () => {
    expect(niceStep(0.037)).toBeCloseTo(0.02);
    expect(niceStep(0.6)).toBeCloseTo(0.5);
    expect(niceStep(13)).toBe(10);
    expect(niceStep(0)).toBe(1);
  });
});

describe("editSeries", () => {
  it("gives back the measured record when nothing is changed", () => {
    const edit = initialEdit(SERIES, 7);
    expect(isUnchanged(edit, SERIES)).toBe(true);
    editSeries(SERIES, edit).forEach(([year, value], index) => {
      expect(year).toBe(SERIES[index]?.[0]);
      expect(value).toBeCloseTo(SERIES[index]?.[1] ?? Number.NaN, 9);
    });
  });

  it("adds a trend per decade that the test reads back", () => {
    const base = readSeries(SERIES).trend?.perDecade ?? 0;
    const edited = readSeries(editSeries(SERIES, { ...initialEdit(SERIES, 7), trend: 0.5 }));
    expect(edited.trend?.perDecade).toBeCloseTo(base + 0.5, 1);
  });

  it("leaves only the trend line without noise", () => {
    const smooth = editSeries(SERIES, { ...initialEdit(SERIES, 7), noise: 0 });
    expect(readSeries(smooth).trend?.noise).toBeCloseTo(0, 6);
  });

  it("invents a flat series at the record's mean, the same for the same seed", () => {
    const edit = { ...initialEdit(SERIES, 11), start: "invented" as const };
    const first = editSeries(SERIES, edit);
    expect(first).toEqual(editSeries(SERIES, edit));
    const mean = first.reduce((sum, [, value]) => sum + value, 0) / first.length;
    expect(mean).toBeCloseTo(10.435, 0);
    expect(editSeries(SERIES, { ...edit, seed: 12 })).not.toEqual(first);
  });

  it("adds an extreme year and cuts the record to its last years", () => {
    const edit = { ...initialEdit(SERIES, 7), spikeYear: 2020, spikeSize: 5, years: 12 };
    const edited = editSeries(SERIES, edit);
    expect(edited).toHaveLength(12);
    expect(edited[0]?.[0]).toBe(2014);
    const spike = edited.find(([year]) => year === 2020)?.[1] ?? 0;
    expect(spike).toBeGreaterThan((SERIES.find(([year]) => year === 2020)?.[1] ?? 0) + 0.3);
  });

  it("keeps a share inside 0–1", () => {
    const share: Point[] = SERIES.map(([year], index) => [year, 0.95 + (index % 2) * 0.03]);
    const edited = editSeries(share, { ...initialEdit(share, 7), trend: 0.5 }, "0–1");
    expect(Math.max(...edited.map(([, value]) => value))).toBeLessThanOrEqual(1);
  });
});

describe("playgroundLimits", () => {
  it("scales the added trend to the record and spans its years", () => {
    const limits = playgroundLimits(SERIES);
    expect(limits.trend.max).toBeGreaterThan(0.3);
    expect(limits.trend.min).toBe(-limits.trend.max);
    expect(limits.years).toEqual({ min: 10, max: 30, step: 1 });
    expect(limits.spikeYear).toMatchObject({ min: 1996, max: 2025 });
  });
});
