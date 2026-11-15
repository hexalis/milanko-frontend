import { describe, expect, it } from "vitest";
import {
  activeFilters,
  archiveHref,
  clearFilters,
  DEFAULT_ARCHIVE_STATE,
  facetOptions,
  isInTopic,
  parseArchiveState,
  withoutFilter,
  withTopic,
  type ArchiveState,
  type ArchiveTopic,
} from "./archive";
import { isEvent } from "./case-file";
import { getCaseCatalog } from "./catalog";

const catalog = getCaseCatalog();
const state = (overrides: Partial<ArchiveState> = {}): ArchiveState => ({
  ...DEFAULT_ARCHIVE_STATE,
  ...overrides,
  facets: { ...DEFAULT_ARCHIVE_STATE.facets, ...overrides.facets },
});

describe("facetOptions", () => {
  it("lists regions in the POC sector order, only those present", () => {
    const { region } = facetOptions(catalog);
    expect(region[0]).toBe("arctic");
    expect(region.every((id) => catalog.all.some((file) => file.region === id))).toBe(true);
  });

  it("keeps the fixed strength, direction and source scales", () => {
    const options = facetOptions(catalog);
    expect(options.ev).toEqual(["strong", "moderate", "weak"]);
    expect(options.dir).toEqual(["up", "down", "flat"]);
    expect(options.src).toEqual(["power", "modis", "eonet"]);
  });
});

describe("topics", () => {
  it("splits the trend themes and gathers every anomaly file under disasters", () => {
    const inTopic = (topic: ArchiveTopic) => catalog.all.filter((file) => isInTopic(file, topic));
    expect(inTopic("all")).toHaveLength(catalog.all.length);
    expect(inTopic("disasters")).toHaveLength(catalog.events.length);
    expect(inTopic("heat").length + inTopic("water").length + inTopic("plants").length).toBe(
      catalog.trends.length,
    );
    expect(inTopic("heat").every((file) => !isEvent(file))).toBe(true);
  });
});

describe("parseArchiveState", () => {
  it("returns the defaults for an empty address", () => {
    expect(parseArchiveState({}, catalog)).toEqual(DEFAULT_ARCHIVE_STATE);
  });

  it("reads topic, search, sort, place and the audit view", () => {
    const parsed = parseArchiveState(
      { topic: "water", q: "chile", sort: "evidence", near: "12.93,-85.92,Matagalpa, Nicaragua" },
      catalog,
    );
    expect(parsed).toMatchObject({ topic: "water", q: "chile", sort: "evidence" });
    expect(parsed.near).toEqual({ lat: 12.93, lon: -85.92, name: "Matagalpa, Nicaragua" });
    expect(parseArchiveState({ kind: "audit" }, catalog).kind).toBe("audit");
  });

  it("sends old kind=event links to the disasters topic", () => {
    expect(parseArchiveState({ kind: "event" }, catalog)).toMatchObject({
      kind: "all",
      topic: "disasters",
    });
    expect(parseArchiveState({ kind: "event", topic: "heat" }, catalog).topic).toBe("heat");
  });

  it("drops values that name no real option", () => {
    const parsed = parseArchiveState(
      { topic: "fire", region: ["arctic", "mars"], col: "x", sort: "loud", near: "95,10,Nowhere" },
      catalog,
    );
    expect(parsed.topic).toBe("all");
    expect(parsed.facets.region).toEqual(["arctic"]);
    expect(parsed.col).toBeUndefined();
    expect(parsed.sort).toBe("recent");
    expect(parsed.near).toBeUndefined();
  });

  it("accepts repeated keys and comma lists, without duplicates", () => {
    const parsed = parseArchiveState({ region: ["arctic,africa", "arctic"] }, catalog);
    expect(parsed.facets.region).toEqual(["arctic", "africa"]);
  });

  it("caps an overlong search", () => {
    expect(parseArchiveState({ q: "x".repeat(500) }, catalog).q).toHaveLength(120);
  });
});

describe("archiveHref", () => {
  it("leaves the plain archive at /cases", () => {
    expect(archiveHref(DEFAULT_ARCHIVE_STATE)).toBe("/cases");
  });

  it("writes topic and place, and round-trips through parseArchiveState", () => {
    const original = state({
      topic: "disasters",
      q: "flood",
      near: { lat: 12.934, lon: -85.917, name: "Matagalpa" },
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["asia"] },
    });
    const href = archiveHref(original);
    expect(href).toBe("/cases?topic=disasters&q=flood&near=12.93%2C-85.92%2CMatagalpa&region=asia");
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parseArchiveState(params, catalog)).toEqual({
      ...original,
      near: { lat: 12.93, lon: -85.92, name: "Matagalpa" },
    });
  });

  it("keeps the other filters when the topic changes", () => {
    expect(archiveHref(withTopic(state({ q: "ice" }), "heat"))).toBe("/cases?topic=heat&q=ice");
  });
});

describe("active filters", () => {
  it("lists kind, shelf, place, search and facets, and removes each", () => {
    const busy = state({
      kind: "trend",
      col: "space",
      q: "green",
      near: { lat: 1, lon: 2, name: "Somewhere" },
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, theme: ["vegetation"] },
    });
    const filters = activeFilters(busy);
    expect(filters.map((filter) => filter.type)).toEqual(["kind", "col", "near", "q", "facet"]);
    const [kind, col, near, q, theme] = filters;
    expect(withoutFilter(busy, kind!).kind).toBe("all");
    expect(withoutFilter(busy, col!).col).toBeUndefined();
    expect(withoutFilter(busy, near!).near).toBeUndefined();
    expect(withoutFilter(busy, q!).q).toBe("");
    expect(withoutFilter(busy, theme!).facets.theme).toEqual([]);
    expect(busy.facets.theme).toEqual(["vegetation"]);
  });

  it("clears everything but the sort", () => {
    const cleared = clearFilters(state({ topic: "water", q: "x", sort: "magnitude" }));
    expect(cleared).toEqual({ ...DEFAULT_ARCHIVE_STATE, sort: "magnitude" });
  });
});
