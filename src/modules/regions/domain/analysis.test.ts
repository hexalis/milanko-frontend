import { describe, expect, it } from "vitest";
import {
  latestAnomaly,
  layoutCalendar,
  readTrend,
  recentAnomalies,
  zBucket,
  zColor,
} from "./analysis";
import { metricUnit, rankingBars } from "./ranking";

describe("readTrend", () => {
  it("needs at least 12 months and a slope", () => {
    expect(readTrend(null)).toEqual({ kind: "missing" });
    expect(readTrend({ n_months: 6, sen_slope_per_year: 0.1 })).toEqual({
      kind: "too-short",
      months: 6,
    });
    expect(readTrend({ n_months: 24, sen_slope_per_year: null })).toEqual({
      kind: "too-short",
      months: 24,
    });
  });

  it("reads a complete trend", () => {
    expect(
      readTrend({
        n_months: 251,
        sen_slope_per_year: 0.11,
        mann_kendall: { trend: "increasing", p_value: 0.001 },
      }),
    ).toEqual({
      kind: "ready",
      slopePerYear: 0.11,
      label: "increasing",
      pValue: 0.001,
      months: 251,
    });
  });
});

describe("anomalies", () => {
  const points = [
    { time: "2025-01-01", anomaly: 1, z: 0.5 },
    { time: "2026-01-01", anomaly: -2, z: -1.4 },
    { time: "2026-02-01", anomaly: null, z: null },
  ];

  it("keeps recent numeric anomalies", () => {
    expect(recentAnomalies(points, "2025-06-01")).toEqual([{ time: "2026-01-01", value: -2 }]);
  });

  it("finds the latest numeric anomaly", () => {
    expect(latestAnomaly(points)?.time).toBe("2026-01-01");
  });
});

describe("calendar", () => {
  it("rounds z to half steps within ±3", () => {
    expect(zBucket(1.26)).toBe(1.5);
    expect(zBucket(-7)).toBe(-3);
    expect(zBucket(0.1)).toBe(0);
  });

  it("colors cold, neutral and warm days", () => {
    expect(zColor(0)).toBe("rgb(247,247,247)");
    expect(zColor(-3)).toBe("rgb(33,102,172)");
    expect(zColor(3)).toBe("rgb(178,24,43)");
  });

  it("groups days by color and places them by year and day of year", () => {
    const layout = layoutCalendar([
      { time: "2024-01-01", z: 0.1 },
      { time: "2024-12-31", z: 2.9 },
      { time: "2026-02-01", z: 0 },
      { time: "2026-02-02", z: null },
    ]);
    expect(layout).toMatchObject({ firstYear: 2024, lastYear: 2026, dayCount: 3 });
    expect(layout?.buckets.map((bucket) => bucket.z)).toEqual([0, 3]);
    expect(layout?.buckets[1]?.cells).toEqual([{ year: 2024, dayOfYear: 365 }]);
  });

  it("returns undefined without z values", () => {
    expect(layoutCalendar([{ time: "2024-01-01", z: null }])).toBeUndefined();
  });
});

describe("rankings", () => {
  it("scales bars to the largest absolute value", () => {
    const bars = rankingBars(
      [
        { code: 1, name: "A", anomaly: 2 },
        { code: 2, name: "B", anomaly: -1 },
        { code: 3, name: "C", anomaly: null },
      ],
      "anomaly",
    );
    expect(bars.map((bar) => [bar.widthPercent, bar.isNegative])).toEqual([
      [100, false],
      [50, true],
      [1, false],
    ]);
  });

  it("expresses trends per year", () => {
    expect(metricUnit("trend", "C")).toBe("C/año");
    expect(metricUnit("value", "C")).toBe("C");
    expect(metricUnit("anomaly", null)).toBe("");
  });
});
