import { describe, expect, it } from "vitest";
import {
  flyCommand,
  initialSelection,
  parseExploreQuery,
  selectionQuery,
  toSelection,
  type ExploreSelection,
} from "./explore-state";
import type { SectorId } from "./sectors";

const REGIONS: Record<string, SectorId> = { "svalbard-warming": "arctic" };
const lookup = { caseRegion: (id: string) => REGIONS[id] };
const years = { firstYear: 2000, lastYear: 2026, defaultYear: 2025 };

const EVENT = {
  id: "EONET_2",
  cat: "severeStorms",
  date: "2024-09-01",
  title: "Hurricane",
  src: "JTWC",
  lat: 25.7,
  lon: -80.1,
  mag: 120,
  unit: "kts",
};

describe("parseExploreQuery", () => {
  it("opens nothing by default and uses the default year", () => {
    expect(parseExploreQuery({}, lookup, years)).toEqual({
      open: { type: "none" },
      year: 2025,
      events: null,
    });
  });

  it("gives a known case file precedence over a region", () => {
    expect(
      parseExploreQuery({ case: "svalbard-warming", region: "europe" }, lookup, years).open,
    ).toEqual({ type: "case", id: "svalbard-warming" });
  });

  it("falls back to the region when the case id is unknown", () => {
    expect(parseExploreQuery({ case: "nope", region: "europe" }, lookup, years).open).toEqual({
      type: "sector",
      id: "europe",
    });
  });

  it("reads an event, near and a point", () => {
    expect(parseExploreQuery({ ev: "EONET_2" }, lookup, years).open).toEqual({
      type: "event",
      id: "EONET_2",
    });
    expect(parseExploreQuery({ near: "10.5,-20" }, lookup, years).open).toEqual({
      type: "near",
      lat: 10.5,
      lon: -20,
    });
    expect(parseExploreQuery({ lat: "-33.9", lon: "151.2" }, lookup, years).open).toEqual({
      type: "point",
      lat: -33.9,
      lon: 151.2,
    });
  });

  it("ignores out-of-range coordinates and years, and odd layer values", () => {
    const query = parseExploreQuery(
      { lat: "91", lon: "0", year: "1999", events: "<b>" },
      lookup,
      years,
    );
    expect(query).toEqual({ open: { type: "none" }, year: 2025, events: null });
    expect(parseExploreQuery({ year: "2026", events: "floods" }, lookup, years)).toMatchObject({
      year: 2026,
      events: "floods",
    });
  });
});

describe("selectionQuery", () => {
  const context = { ...lookup, events: null, year: 2025, defaultYear: 2025 };

  it("is empty with nothing open", () => {
    expect(selectionQuery(null, context)).toBe("");
  });

  it("writes the case and its region", () => {
    expect(selectionQuery({ type: "case", id: "svalbard-warming" }, context)).toBe(
      "?region=arctic&case=svalbard-warming",
    );
  });

  it("writes a point with three decimals", () => {
    const point: ExploreSelection = { type: "point", lat: 1.23456, lon: -2, sector: null };
    expect(selectionQuery(point, context)).toBe("?lat=1.235&lon=-2.000");
  });

  it("writes an event with its own year, so the link reopens it", () => {
    expect(selectionQuery({ type: "event", ev: EVENT, sector: null }, context)).toBe(
      "?ev=EONET_2&year=2024",
    );
  });

  it("keeps the events layer, and its year when it is not the default", () => {
    expect(
      selectionQuery({ type: "sector", id: "europe" }, { ...context, events: "all", year: 2010 }),
    ).toBe("?region=europe&year=2010&events=all");
  });
});

describe("initialSelection", () => {
  it("opens a case, a sector or a point at once, but not an event or a fly-over", () => {
    expect(initialSelection({ type: "case", id: "svalbard-warming" })).toEqual({
      type: "case",
      id: "svalbard-warming",
    });
    expect(initialSelection({ type: "point", lat: -1.3, lon: 36.8 })).toEqual({
      type: "point",
      lat: -1.3,
      lon: 36.8,
      sector: "africa",
    });
    expect(initialSelection({ type: "event", id: "EONET_2" })).toBeNull();
    expect(initialSelection({ type: "near", lat: 1, lon: 2 })).toBeNull();
    expect(initialSelection({ type: "none" })).toBeNull();
  });
});

describe("toSelection", () => {
  it("adds the sector to points and events", () => {
    expect(toSelection({ type: "point", lat: 48.85, lon: 2.35 })).toEqual({
      type: "point",
      lat: 48.85,
      lon: 2.35,
      sector: "europe",
    });
    expect(toSelection({ type: "event", ev: EVENT })).toMatchObject({ sector: "north-america" });
  });
});

describe("flyCommand", () => {
  const caseAt = (id: string) => (id === "svalbard-warming" ? ([78, 15] as const) : undefined);

  it("flies to a sector's center", () => {
    expect(flyCommand({ type: "sector", id: "europe" }, caseAt)).toEqual({
      type: "fly",
      kind: "sector",
      id: "europe",
      lat: 50,
      lon: 15,
    });
  });

  it("flies to a case file, or not at all when its place is unknown", () => {
    expect(flyCommand({ type: "case", id: "svalbard-warming" }, caseAt)).toMatchObject({
      kind: "case",
      lat: 78,
      lon: 15,
    });
    expect(flyCommand({ type: "case", id: "x" }, caseAt)).toBeNull();
  });

  it("flies to a data region's centre when known, and never for the satellite", () => {
    const reading = {
      variable: "T2M",
      label: "Air temperature",
      source: "NASA POWER",
      unit: "°C",
      date: "2026-11-15",
      period: "day" as const,
      value: 31.4,
      anomaly: 2.1,
      z: 2.4,
      baseline: 29.3,
    };
    const region = { type: "region", code: 14, place: "africa", reading } as const;
    expect(flyCommand({ ...region, lat: 18.2, lon: 4.5 }, caseAt)).toEqual({
      type: "fly",
      kind: "region",
      lat: 18.2,
      lon: 4.5,
    });
    expect(flyCommand({ ...region, lat: null, lon: null }, caseAt)).toBeNull();
    expect(flyCommand({ type: "satellite", id: "terra" }, caseAt)).toBeNull();
  });

  it("hands the globe what it needs to animate an event's tile", () => {
    expect(flyCommand({ type: "event", ev: EVENT, sector: null }, caseAt)).toEqual({
      type: "fly",
      kind: "event",
      lat: 25.7,
      lon: -80.1,
      ev: {
        cat: "severeStorms",
        id: "EONET_2",
        date: "2024-09-01",
        title: "Hurricane",
        lat: 25.7,
        lon: -80.1,
      },
    });
  });
});
