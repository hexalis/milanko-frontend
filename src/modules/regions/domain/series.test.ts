import { describe, expect, it } from "vitest";
import { pickRegion, regionLabel } from "./region";
import { summarizeObservations, toObservationsCsv, toSeries, type Observation } from "./series";

const observation = (date: string, value: number | null): Observation => ({
  variable: "T2M",
  date,
  value,
  unit: "C",
  quality: "ok",
});

describe("toSeries", () => {
  it("keeps daily points while the series is short and drops missing values", () => {
    const series = toSeries([
      observation("2026-01-01", 1),
      observation("2026-01-02", null),
      observation("2026-01-03", 3),
    ]);
    expect(series).toEqual({
      points: [
        { date: "2026-01-01", value: 1 },
        { date: "2026-01-03", value: 3 },
      ],
      isMonthlyMean: false,
    });
  });

  it("switches to monthly means above 1200 points", () => {
    const days = Array.from({ length: 1300 }, (_, index) => {
      const date = new Date(Date.UTC(2020, 0, 1 + index)).toISOString().slice(0, 10);
      return observation(date, date.startsWith("2020-01") ? 10 : 0);
    });
    const series = toSeries(days);
    expect(series.isMonthlyMean).toBe(true);
    expect(series.points[0]).toEqual({ date: "2020-01-01", value: 10 });
    expect(series.points.length).toBeLessThan(50);
  });
});

describe("summarizeObservations", () => {
  it("reports range, latest numeric value and stats", () => {
    const summary = summarizeObservations([
      observation("2026-01-01", 2),
      observation("2026-01-02", 4),
      observation("2026-01-03", null),
    ]);
    expect(summary).toMatchObject({
      count: 3,
      firstDate: "2026-01-01",
      lastDate: "2026-01-03",
      mean: 3,
      min: 2,
      max: 4,
      numericCount: 2,
    });
    expect(summary.latest?.date).toBe("2026-01-02");
  });

  it("handles an empty series", () => {
    expect(summarizeObservations([])).toMatchObject({ count: 0, numericCount: 0, mean: undefined });
  });
});

describe("toObservationsCsv", () => {
  it("writes a header and escapes commas and quotes", () => {
    const csv = toObservationsCsv([
      { ...observation("2026-01-01", 1.5), quality: 'gap, "estimated"' },
    ]);
    expect(csv).toBe(
      'date,variable,value,unit,quality,valid_fraction\n2026-01-01,T2M,1.5,C,"gap, ""estimated""",\n',
    );
  });
});

describe("regions", () => {
  const regions = [
    { code: 1, name: "Uno" },
    { code: 24, name: "Veinticuatro" },
  ];

  it("pads the code in labels", () => {
    expect(regionLabel(regions[1]!)).toBe("024 · Veinticuatro");
  });

  it("picks the requested region or the first one", () => {
    expect(pickRegion(regions, "24")?.code).toBe(24);
    expect(pickRegion(regions, "999")?.code).toBe(1);
    expect(pickRegion(regions, "1; drop")?.code).toBe(1);
  });
});
