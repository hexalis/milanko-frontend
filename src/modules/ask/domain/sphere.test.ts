import { describe, expect, it } from "vitest";
import { EARTH_TEXTURE_URL, easeOutCubic, paintSphere, projectSphere } from "./sphere";

describe("projectSphere", () => {
  it("keeps only the pixels inside the disc", () => {
    const map = projectSphere({ width: 20, height: 20, dpr: 1, cx: 10, cy: 10, r: 10 });
    // π·r² ≈ 314 of the 400 pixels.
    expect(map.count).toBeGreaterThan(290);
    expect(map.count).toBeLessThan(330);
  });

  it("puts the north pole up when there is no tilt", () => {
    const map = projectSphere({
      width: 21,
      height: 21,
      dpr: 1,
      cx: 10.5,
      cy: 10.5,
      r: 10.5,
      roll: 0,
      pitch: 0,
    });
    const first = map.lat[0] ?? 0;
    const last = map.lat[map.count - 1] ?? 0;
    expect(first).toBeGreaterThan(1.2);
    expect(last).toBeLessThan(-1.2);
    // The centre pixel looks at latitude and longitude 0.
    const centre = Array.from(map.at.subarray(0, map.count)).indexOf((10 * 21 + 10) * 4);
    expect(map.lat[centre]).toBeCloseTo(0, 5);
    expect(map.lon[centre]).toBeCloseTo(0, 5);
  });

  it("lights the upper left more than the lower right", () => {
    const map = projectSphere({ width: 20, height: 20, dpr: 1, cx: 10, cy: 10, r: 10 });
    const shadeAt = (x: number, y: number) =>
      map.shade[Array.from(map.at.subarray(0, map.count)).indexOf((y * 20 + x) * 4)] ?? 0;
    expect(shadeAt(5, 5)).toBeGreaterThan(shadeAt(15, 15));
  });
});

describe("paintSphere", () => {
  it("paints the disc opaque and leaves the corners empty", () => {
    const map = projectSphere({ width: 10, height: 10, dpr: 1, cx: 5, cy: 5, r: 5 });
    const texture = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([200, 100, 50, 255, 200, 100, 50, 255]),
    };
    const out = new Uint8ClampedArray(10 * 10 * 4);
    paintSphere(map, texture, 0, out);
    expect(out[3]).toBe(0);
    const centre = (5 * 10 + 5) * 4;
    expect(out[centre + 3]).toBe(255);
    expect(out[centre]).toBeGreaterThan(0);
    expect(out[centre]).toBeLessThanOrEqual(200);
  });
});

describe("helpers", () => {
  it("eases out and clamps", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it("asks GIBS for the whole Blue Marble", () => {
    const url = new URL(EARTH_TEXTURE_URL);
    expect(url.hostname).toBe("gibs.earthdata.nasa.gov");
    expect(url.searchParams.get("LAYERS")).toBe("BlueMarble_ShadedRelief_Bathymetry");
    expect(url.searchParams.get("BBOX")).toBe("-90,-180,90,180");
  });
});
