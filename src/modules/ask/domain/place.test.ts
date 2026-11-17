import { describe, expect, it } from "vitest";
import {
  annualMeans,
  foundName,
  isAgainstPlanet,
  parseLiveVariable,
  parsePoint,
  placeHref,
  pointFile,
  type MonthlyValue,
} from "./place";

/** Twelve months of `year`, each `value` plus a little seasonal wave. */
function year(y: number, value: number): MonthlyValue[] {
  return Array.from({ length: 12 }, (_, index) => ({
    time: `${y}-${String(index + 1).padStart(2, "0")}-01`,
    value: value + (index % 2 ? 0.5 : -0.5),
  }));
}

describe("parsePoint", () => {
  it("reads a point rounded to two decimals, with its name", () => {
    expect(parsePoint({ lat: "12.927", lon: "-85.919", name: " Matagalpa " })).toEqual({
      lat: 12.93,
      lon: -85.92,
      name: "Matagalpa",
    });
  });

  it("refuses a missing, malformed or off-the-map coordinate", () => {
    expect(parsePoint({ lat: "12" })).toBeUndefined();
    expect(parsePoint({ lat: "", lon: "" })).toBeUndefined();
    expect(parsePoint({ lat: "91", lon: "0" })).toBeUndefined();
    expect(parsePoint({ lat: "0", lon: "-181" })).toBeUndefined();
    expect(parsePoint({ lat: "1e2", lon: "0" })).toBeUndefined();
  });
});

describe("parseLiveVariable and placeHref", () => {
  it("falls back to air temperature and leaves it out of the link", () => {
    expect(parseLiveVariable({ var: "T2M_MAX" })).toBe("T2M");
    expect(parseLiveVariable({ var: "RH2M" })).toBe("RH2M");
    const point = { lat: 12.9, lon: -85.9, name: "Matagalpa, Nicaragua" };
    expect(placeHref(point)).toBe("/place?lat=12.90&lon=-85.90&name=Matagalpa%2C+Nicaragua");
    expect(placeHref({ ...point, name: undefined }, "PRECTOTCORR")).toBe(
      "/place?lat=12.90&lon=-85.90&var=PRECTOTCORR",
    );
  });
});

describe("annualMeans", () => {
  it("averages complete years and leaves out any year with a gap", () => {
    const gap = year(2002, 30).map((month, index) =>
      index === 5 ? { ...month, value: null } : month,
    );
    const partial = year(2003, 40).slice(0, 10);
    expect(annualMeans([...year(2001, 20), ...gap, ...partial, ...year(2000, 10)])).toEqual([
      [2000, 10],
      [2001, 20],
    ]);
  });
});

describe("pointFile", () => {
  const point = { lat: 12.93, lon: -85.92, name: "Matagalpa" };

  it("reads a warming point as a confirmed trend file", () => {
    const values = Array.from({ length: 30 }, (_, index) =>
      year(1990 + index, 20 + index * 0.05),
    ).flat();
    const file = pointFile(point, "T2M", values);
    expect(file?.series).toHaveLength(30);
    expect(file?.t.significant).toBe(true);
    expect(file?.t.slope).toBeGreaterThan(0);
    expect(file).toMatchObject({ kind: "trend", variable: "T2M", unit: "°C", source: "power" });
    expect(file && isAgainstPlanet(file, 0.17)).toBe(false);
    expect(file && isAgainstPlanet(file, -0.1)).toBe(true);
  });

  it("gives nothing when too few complete years remain for the test", () => {
    expect(pointFile(point, "T2M", [...year(2000, 1), ...year(2001, 2)])).toBeUndefined();
  });
});

describe("foundName", () => {
  it("adds the country, once", () => {
    expect(foundName({ name: "Matagalpa", admin: "Departamento de Matagalpa, Nicaragua" })).toBe(
      "Matagalpa, Nicaragua",
    );
    expect(foundName({ name: "Nicaragua", admin: "Nicaragua" })).toBe("Nicaragua");
    expect(foundName({ name: "Null Island", admin: "" })).toBe("Null Island");
  });
});
