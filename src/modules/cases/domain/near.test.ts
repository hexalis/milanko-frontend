import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "./catalog";
import { kmBetween, nearParam, parseNear, resolvePlace, roundKm, shortPlaceName } from "./near";

const catalog = getCaseCatalog();

describe("kmBetween", () => {
  it("is zero for the same point and symmetric", () => {
    expect(kmBetween(10, 20, 10, 20)).toBe(0);
    expect(kmBetween(0, 0, 10, 10)).toBeCloseTo(kmBetween(10, 10, 0, 0), 9);
  });

  it("measures known distances on the sphere", () => {
    // One degree of latitude is about 111 km; Matagalpa to Telica volcano about 110 km (docs/18 §6).
    expect(kmBetween(0, 0, 1, 0)).toBeCloseTo(111.2, 0);
    expect(roundKm(kmBetween(12.93, -85.92, 12.61, -86.84))).toBe(110);
  });
});

describe("roundKm", () => {
  it("rounds like the POC: 5 km, 10 km, then 100 km steps, never under 5", () => {
    expect(roundKm(1)).toBe(5);
    expect(roundKm(83)).toBe(85);
    expect(roundKm(534)).toBe(530);
    expect(roundKm(5149)).toBe(5100);
  });
});

describe("near parameter", () => {
  it("reads lat,lon,name and writes it back with two decimals", () => {
    const place = parseNear("12.934,-85.917,Matagalpa, Nicaragua");
    expect(place).toEqual({ lat: 12.934, lon: -85.917, name: "Matagalpa, Nicaragua" });
    expect(nearParam(place!)).toBe("12.93,-85.92,Matagalpa, Nicaragua");
    expect(shortPlaceName(place!)).toBe("Matagalpa");
  });

  it("drops anything out of range or not a number", () => {
    expect(parseNear("10,20")?.name).toBe("10° 20°");
    expect(shortPlaceName(parseNear("10,20")!)).toBe("10° 20°");
    expect(parseNear(undefined)).toBeUndefined();
    expect(parseNear("91,0")).toBeUndefined();
    expect(parseNear("0,181")).toBeUndefined();
    expect(parseNear("north,south")).toBeUndefined();
    expect(parseNear(",5")).toBeUndefined();
  });
});

describe("resolvePlace", () => {
  it("accepts typed coordinates", () => {
    expect(resolvePlace("-33.4, -70.6", catalog.all)).toMatchObject({ lat: -33.4, lon: -70.6 });
  });

  it("finds a place named by a file, in either language and without accents", () => {
    const japan = resolvePlace("japon", catalog.all);
    expect(japan).toMatchObject({ lat: 35.27, lon: 139.67 });
    expect(resolvePlace("Nicaragua", catalog.all)).toMatchObject({ lat: 12.61, lon: -86.84 });
  });

  it("returns nothing for a place the shipped data does not name", () => {
    expect(resolvePlace("Matagalpa", catalog.all)).toBeUndefined();
    expect(resolvePlace("   ", catalog.all)).toBeUndefined();
  });
});
