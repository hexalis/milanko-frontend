import { describe, expect, it } from "vitest";
import { ORBIT_BOX, orbitPath, orbitPoint, orbitStations } from "./home-orbit";

describe("home orbit", () => {
  it("tilts the ring: its right end rises above the centre", () => {
    const [x, y] = orbitPoint(0);
    expect(x).toBeGreaterThan(ORBIT_BOX / 2);
    expect(y).toBeLessThan(ORBIT_BOX / 2);
  });

  it("draws a half ring as one path", () => {
    const path = orbitPath(0, 180);
    expect(path.startsWith("M")).toBe(true);
    expect(path.split("L")).toHaveLength(46);
  });

  it("places four stations inside the box, the question one larger", () => {
    const stations = orbitStations();
    expect(stations.map((station) => station.key)).toEqual(["ask", "map", "cases", "method"]);
    for (const station of stations) {
      expect(station.x).toBeGreaterThan(0);
      expect(station.x).toBeLessThan(ORBIT_BOX);
      expect(station.labelY).toBeGreaterThan(0);
    }
    expect(stations[0]?.r).toBeGreaterThan(stations[1]?.r ?? 0);
  });
});
