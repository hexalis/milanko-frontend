import { describe, expect, it } from "vitest";
import { isSectorId, kmBetween, SECTOR_CENTER, SECTOR_IDS, sectorOf } from "./sectors";

describe("sectorOf", () => {
  it("puts the polar caps in their sector even at sea", () => {
    expect(sectorOf(78, 15, false)).toBe("arctic");
    expect(sectorOf(-75, 0, false)).toBe("antarctica");
  });

  it("returns null for open water outside the caps", () => {
    expect(sectorOf(0, -30, false)).toBeNull();
  });

  it("follows the POC's boxes in order", () => {
    expect(sectorOf(48.85, 2.35)).toBe("europe");
    expect(sectorOf(19.4, -99.1)).toBe("central-america");
    expect(sectorOf(40.7, -74)).toBe("north-america");
    expect(sectorOf(64, -20)).toBe("north-america");
    expect(sectorOf(-23.5, -46.6)).toBe("south-america");
    expect(sectorOf(-1.3, 36.8)).toBe("africa");
    // Arabia is east of 34° and north of 12°: not Africa.
    expect(sectorOf(24.7, 46.7)).toBe("asia");
    expect(sectorOf(-33.9, 151.2)).toBe("oceania");
    expect(sectorOf(-17.5, -149.6)).toBe("oceania");
    expect(sectorOf(35.7, 139.7)).toBe("asia");
  });

  it("has a center for every sector, and every center falls in its own sector", () => {
    for (const id of SECTOR_IDS) {
      const [lat, lon] = SECTOR_CENTER[id];
      expect(sectorOf(lat, lon)).toBe(id);
    }
  });
});

describe("isSectorId", () => {
  it("accepts only the nine ids", () => {
    expect(isSectorId("europe")).toBe(true);
    expect(isSectorId("ocean")).toBe(false);
    expect(isSectorId(undefined)).toBe(false);
  });
});

describe("kmBetween", () => {
  it("is zero for the same point and about 111 km per degree of latitude", () => {
    expect(kmBetween(10, 10, 10, 10)).toBe(0);
    expect(kmBetween(0, 0, 1, 0)).toBeCloseTo(111.2, 0);
  });
});
