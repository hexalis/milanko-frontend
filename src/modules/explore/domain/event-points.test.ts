import { describe, expect, it } from "vitest";
import { eventPointsUrl, findEventPoint } from "./event-points";

const FILE = {
  fields: ["lon", "lat", "category", "date", "title", "source", "id", "magnitude", "unit"],
  points: [
    [
      145.65,
      -23.14,
      "wildfires",
      "2025-01-01",
      "Wildfire in Australia",
      "GDACS",
      "EONET_1",
      null,
      "",
    ],
    [-80.1, 25.7, "severeStorms", "2025-09-01", "Hurricane", "JTWC", "EONET_2", 120, "kts"],
  ],
};

describe("findEventPoint", () => {
  it("finds an event by id and names its fields", () => {
    expect(findEventPoint(FILE, "EONET_2")).toEqual({
      lon: -80.1,
      lat: 25.7,
      cat: "severeStorms",
      date: "2025-09-01",
      title: "Hurricane",
      src: "JTWC",
      id: "EONET_2",
      mag: 120,
      unit: "kts",
    });
  });

  it("returns null for a missing id or a malformed file", () => {
    expect(findEventPoint(FILE, "EONET_9")).toBeNull();
    expect(findEventPoint({ points: "nope" }, "EONET_1")).toBeNull();
    expect(findEventPoint(null, "EONET_1")).toBeNull();
  });
});

describe("eventPointsUrl", () => {
  it("points at the globe's copy of the snapshot", () => {
    expect(eventPointsUrl(2024)).toBe("/globe/data/events/2024.json");
  });
});
