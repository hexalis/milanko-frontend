import { describe, expect, it } from "vitest";
import { directionOf, rarityOf, regionCode } from "./region-reading";

describe("rarityOf", () => {
  it("names how far from normal a day is by its z, either way", () => {
    expect(rarityOf(0.4)).toBe("normal");
    expect(rarityOf(-1.2)).toBe("uncommon");
    expect(rarityOf(2.5)).toBe("rare");
    expect(rarityOf(-3.4)).toBe("exceptional");
  });

  it("says nothing without a z", () => {
    expect(rarityOf(null)).toBeNull();
    expect(rarityOf(Number.NaN)).toBeNull();
  });
});

describe("directionOf", () => {
  it("tells the side of normal from the difference", () => {
    expect(directionOf({ anomaly: 2.1 })).toBe("above");
    expect(directionOf({ anomaly: -0.3 })).toBe("below");
    expect(directionOf({ anomaly: 0 })).toBe("equal");
    expect(directionOf({ anomaly: null })).toBeNull();
  });
});

describe("regionCode", () => {
  it("pads the code to three digits, as the map writes it", () => {
    expect(regionCode(14)).toBe("014");
    expect(regionCode(161)).toBe("161");
  });
});
