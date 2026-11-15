import { describe, expect, it } from "vitest";
import casesData from "../data/cases.json";
import { analyzeTrend, mannKendall, median, senSlope } from "./trend-stats";

describe("analyzeTrend", () => {
  // The POC's build script (scripts/trend.py) wrote its own trend block into cases.json;
  // the port must agree with it for every case.
  it.each(casesData.cases.map((record) => [record.id, record] as const))(
    "matches the build's statistics for %s",
    (_id, record) => {
      const result = analyzeTrend(
        record.series.map(([year]) => year as number),
        record.series.map(([, value]) => value as number),
      );
      expect(result).not.toBeNull();
      expect(result?.s).toBe(record.trend.s);
      expect(result?.slope).toBeCloseTo(record.trend.slope, 5);
      expect(result?.slopeLow).toBeCloseTo(record.trend.slopeLow, 5);
      expect(result?.slopeHigh).toBeCloseTo(record.trend.slopeHigh, 5);
      expect(result?.p).toBeCloseTo(record.trend.p, 3);
      expect(result?.significant).toBe(record.trend.significant);
    },
  );

  it("needs at least 8 points", () => {
    expect(analyzeTrend([1, 2, 3], [1, 2, 3])).toBeNull();
  });

  it("grades evidence by p", () => {
    const years = Array.from({ length: 30 }, (_, index) => 1990 + index);
    expect(
      analyzeTrend(
        years,
        years.map((year) => year * 0.1),
      )?.strength,
    ).toBe("strong");
    const noisy = years.map((_, index) => [3, 1, 4, 1, 5, 9, 2, 6][index % 8] ?? 0);
    expect(analyzeTrend(years, noisy)?.strength).toBe("weak");
  });
});

describe("building blocks", () => {
  it("computes the median of odd and even lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("scores a rising series as positive and a flat one as zero", () => {
    expect(mannKendall([1, 2, 3, 4]).s).toBe(6);
    expect(mannKendall([2, 2, 2, 2]).z).toBe(0);
  });

  it("finds the slope of a straight line", () => {
    expect(senSlope([0, 1, 2, 3], [1, 3, 5, 7]).slope).toBe(2);
  });
});
