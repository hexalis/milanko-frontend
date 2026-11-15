import { describe, expect, it } from "vitest";
import {
  filterCoverage,
  listVariableOptions,
  pickVariable,
  summarizeCoverage,
  type VariableCoverage,
} from "./coverage";

const rows: VariableCoverage[] = [
  { variable: "T2M", source: "NASA POWER", name: "Temperature at 2 Meters", unit: "C", count: 500, start: "2006-01-01", end: "2026-11-01" },
  { variable: "NDVI", source: "NASA GIBS", name: "MODIS NDVI", unit: "index", count: 900, start: "2010-01-01", end: "2026-10-01" },
  { variable: "PRECTOTCORR", source: "NASA POWER", name: "Precipitation", unit: "mm/day", count: 100, start: null, end: null },
];

describe("filterCoverage", () => {
  it("filters by source and searches every text column", () => {
    expect(filterCoverage(rows, { source: "NASA POWER", isSortedByCount: false }).map((row) => row.variable)).toEqual([
      "PRECTOTCORR",
      "T2M",
    ]);
    expect(filterCoverage(rows, { query: "modis", isSortedByCount: false }).map((row) => row.variable)).toEqual(["NDVI"]);
    expect(filterCoverage(rows, { query: "mm/day", isSortedByCount: false })).toHaveLength(1);
  });

  it("sorts by row count when asked", () => {
    expect(filterCoverage(rows, { isSortedByCount: true }).map((row) => row.count)).toEqual([900, 500, 100]);
  });
});

describe("summarizeCoverage", () => {
  it("adds rows and finds the historical range", () => {
    expect(summarizeCoverage(rows)).toEqual({
      variableCount: 3,
      observationCount: 1500,
      sources: [
        { source: "NASA GIBS", variableCount: 1 },
        { source: "NASA POWER", variableCount: 2 },
      ],
      firstDate: "2006-01-01",
      lastDate: "2026-11-01",
    });
  });
});

describe("pickVariable", () => {
  const options = listVariableOptions(rows);

  it("keeps a requested variable that exists", () => {
    expect(pickVariable(options, "NDVI")?.variable).toBe("NDVI");
  });

  it("defaults to T2M when the request is unknown", () => {
    expect(pickVariable(options, "NOPE")?.variable).toBe("T2M");
  });

  it("returns undefined for an empty catalog", () => {
    expect(pickVariable([], "T2M")).toBeUndefined();
  });
});
