import { describe, expect, it } from "vitest";
import {
  activeFilters,
  archiveHref,
  clearFilters,
  collectionCounts,
  DEFAULT_ARCHIVE_STATE,
  facetCounts,
  facetOptions,
  facetValue,
  filterArchive,
  isInCollection,
  kindCounts,
  matchesSearch,
  normalizeSearch,
  parseArchiveState,
  searchTerms,
  selectedFilterCount,
  shelfGroups,
  sortFiles,
  suggestRelaxation,
  toggleCollection,
  toggleFacet,
  withKind,
  withoutFilter,
  type ArchiveState,
} from "./archive";
import { fileP, fileSnr, isEvent, type CaseFile } from "./case-file";
import { getCaseCatalog } from "./catalog";

const catalog = getCaseCatalog();
const byId = (id: string): CaseFile => {
  const file = catalog.all.find((candidate) => candidate.id === id);
  if (!file) throw new Error(`missing ${id}`);
  return file;
};
const ids = (files: readonly CaseFile[]) => files.map((file) => file.id);
const state = (overrides: Partial<ArchiveState> = {}): ArchiveState => ({
  ...DEFAULT_ARCHIVE_STATE,
  ...overrides,
  facets: { ...DEFAULT_ARCHIVE_STATE.facets, ...overrides.facets },
});

describe("facetOptions", () => {
  it("lists regions in the POC sector order, only those present", () => {
    const { region } = facetOptions(catalog);
    expect(region[0]).toBe("arctic");
    expect(region).toEqual(
      [
        "arctic",
        "north-america",
        "central-america",
        "south-america",
        "europe",
        "africa",
        "asia",
        "oceania",
        "antarctica",
      ].filter((id) => catalog.all.some((file) => file.region === id)),
    );
  });

  it("offers trend themes and event categories as one theme facet", () => {
    const { theme } = facetOptions(catalog);
    expect(theme).toEqual(expect.arrayContaining(["temperature", "water", "vegetation", "floods"]));
    expect(new Set(theme).size).toBe(theme.length);
  });

  it("keeps the fixed strength, direction and source scales", () => {
    const options = facetOptions(catalog);
    expect(options.ev).toEqual(["strong", "moderate", "weak"]);
    expect(options.dir).toEqual(["up", "down", "flat"]);
    expect(options.src).toEqual(["power", "modis", "eonet"]);
  });
});

describe("parseArchiveState", () => {
  it("returns the defaults for an empty address", () => {
    expect(parseArchiveState({}, catalog)).toEqual(DEFAULT_ARCHIVE_STATE);
  });

  it("reads kind, sort, search and collection", () => {
    const parsed = parseArchiveState(
      { kind: "event", sort: "magnitude", q: "  japan  ", col: "records" },
      catalog,
    );
    expect(parsed).toMatchObject({ kind: "event", sort: "magnitude", q: "japan", col: "records" });
  });

  it("drops values that name no real option", () => {
    const parsed = parseArchiveState(
      {
        kind: "audit",
        sort: "random",
        col: "<b>",
        region: "atlantis",
        ev: "huge",
        dir: "sideways",
      },
      catalog,
    );
    expect(parsed).toEqual(DEFAULT_ARCHIVE_STATE);
  });

  it("accepts repeated keys and comma lists, without duplicates", () => {
    const parsed = parseArchiveState(
      { region: ["arctic", "africa,arctic"], src: "power,modis,nope" },
      catalog,
    );
    expect(parsed.facets.region).toEqual(["arctic", "africa"]);
    expect(parsed.facets.src).toEqual(["power", "modis"]);
  });

  it("caps an overlong search", () => {
    expect(parseArchiveState({ q: "x".repeat(500) }, catalog).q).toHaveLength(120);
  });
});

describe("archiveHref", () => {
  it("leaves the plain archive at /cases", () => {
    expect(archiveHref(DEFAULT_ARCHIVE_STATE)).toBe("/cases");
  });

  it("writes only what differs from the defaults, facets as repeated keys", () => {
    const href = archiveHref(
      state({
        kind: "trend",
        q: "río",
        sort: "evidence",
        col: "arctic",
        facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic", "africa"] },
      }),
    );
    expect(href).toBe(
      "/cases?kind=trend&q=r%C3%ADo&region=arctic&region=africa&col=arctic&sort=evidence",
    );
  });

  it("round-trips through parseArchiveState", () => {
    const original = state({
      kind: "event",
      q: "fire",
      sort: "magnitude",
      col: "records",
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, ev: ["strong"], dir: ["up", "down"] },
    });
    const params = Object.fromEntries(
      [...new URLSearchParams(archiveHref(original).split("?")[1]).entries()].reduce(
        (map, [key, value]) => map.set(key, [...(map.get(key) ?? []), value]),
        new Map<string, string[]>(),
      ),
    );
    expect(parseArchiveState(params, catalog)).toEqual(original);
  });
});

describe("state transitions", () => {
  it("toggles a facet value on and off without touching the original", () => {
    const base = state();
    const on = toggleFacet(base, "region", "arctic");
    expect(on.facets.region).toEqual(["arctic"]);
    expect(base.facets.region).toEqual([]);
    expect(toggleFacet(on, "region", "arctic").facets.region).toEqual([]);
  });

  it("toggles the single collection", () => {
    const on = toggleCollection(state(), "space");
    expect(on.col).toBe("space");
    expect(toggleCollection(on, "records").col).toBe("records");
    expect(toggleCollection(on, "space").col).toBeUndefined();
  });

  it("clears filters but keeps the kind tab and the sort", () => {
    const busy = state({
      kind: "trend",
      sort: "evidence",
      q: "rain",
      col: "false",
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, theme: ["water"] },
    });
    expect(clearFilters(busy)).toEqual(state({ kind: "trend", sort: "evidence" }));
    expect(withKind(busy, "event").kind).toBe("event");
  });

  it("lists active filters as collection, search, then facets, and removes each", () => {
    const busy = state({
      q: "rain",
      col: "false",
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, theme: ["water"], src: ["power"] },
    });
    const filters = activeFilters(busy);
    expect(filters).toEqual([
      { type: "col", value: "false" },
      { type: "q", value: "rain" },
      { type: "facet", key: "theme", value: "water" },
      { type: "facet", key: "src", value: "power" },
    ]);
    expect(selectedFilterCount(busy)).toBe(3);
    const [col, q, theme] = filters;
    expect(withoutFilter(busy, col!).col).toBeUndefined();
    expect(withoutFilter(busy, q!).q).toBe("");
    expect(withoutFilter(busy, theme!).facets.theme).toEqual([]);
  });
});

describe("search", () => {
  it("normalizes case and accents", () => {
    expect(normalizeSearch("Sequía en JAPÓN")).toBe("sequia en japon");
    expect(searchTerms("  hot   Arctic ")).toEqual(["hot", "arctic"]);
  });

  it("matches the case texts in both languages", () => {
    const svalbard = byId("svalbard-warming");
    expect(matchesSearch(svalbard, "svalbard")).toBe(true);
    expect(matchesSearch(svalbard, "Ártico")).toBe(true);
    expect(matchesSearch(svalbard, "temperatura")).toBe(true);
  });

  it("matches the theme synonyms", () => {
    expect(matchesSearch(byId("chile-drying"), "drought")).toBe(true);
    expect(matchesSearch(byId("amazon-browning"), "deforestation")).toBe(true);
    expect(matchesSearch(byId("amazon-browning"), "calor")).toBe(false);
  });

  it("requires every term", () => {
    expect(matchesSearch(byId("svalbard-warming"), "svalbard rainfall")).toBe(false);
  });

  it("finds anomaly files by their Spanish category and catalog number", () => {
    const flood = catalog.events.find((file) => file.category === "floods");
    expect(flood).toBeDefined();
    expect(matchesSearch(flood!, "inundaciones")).toBe(true);
    expect(matchesSearch(flood!, flood!.catalog.toLowerCase())).toBe(true);
  });

  it("treats an empty search as no filter", () => {
    expect(matchesSearch(byId("murray-rain"), "   ")).toBe(true);
  });
});

describe("filterArchive", () => {
  it("returns everything by default, newest first", () => {
    const hits = filterArchive(catalog, state());
    expect(hits).toHaveLength(catalog.all.length);
    expect(hits[0]).toBeDefined();
  });

  it("filters by kind", () => {
    expect(filterArchive(catalog, state({ kind: "trend" }))).toHaveLength(6);
    expect(filterArchive(catalog, state({ kind: "event" }))).toHaveLength(32);
  });

  it("ORs values inside a facet and ANDs across facets", () => {
    const either = filterArchive(
      catalog,
      state({ facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic", "africa"] } }),
    );
    expect(either.every((file) => ["arctic", "africa"].includes(file.region))).toBe(true);
    expect(ids(either)).toEqual(expect.arrayContaining(["svalbard-warming", "sahel-wetting"]));

    const both = filterArchive(
      catalog,
      state({
        facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic"], src: ["modis"] },
      }),
    );
    expect(ids(both)).toEqual(["tundra-greening"]);
  });

  it("applies a collection", () => {
    expect(ids(filterArchive(catalog, state({ col: "space" }))).sort()).toEqual([
      "amazon-browning",
      "tundra-greening",
    ]);
    const opposite = filterArchive(catalog, state({ col: "opposite" }));
    expect(opposite).toHaveLength(4);
    const records = filterArchive(catalog, state({ col: "records" }));
    expect(records.every(isEvent)).toBe(true);
    expect(records.every((file) => isInCollection(file, "records"))).toBe(true);
  });

  it("finds Murray-Darling among the false alarms", () => {
    expect(ids(filterArchive(catalog, state({ kind: "trend", col: "false" })))).toEqual([
      "murray-rain",
    ]);
  });
});

describe("sortFiles", () => {
  it("sorts by evidence (smallest chance first) and by magnitude", () => {
    const byEvidence = sortFiles(catalog.all, "evidence").map(fileP);
    expect(byEvidence).toEqual([...byEvidence].sort((a, b) => a - b));
    const byMagnitude = sortFiles(catalog.all, "magnitude").map(fileSnr);
    expect(byMagnitude).toEqual([...byMagnitude].sort((a, b) => b - a));
  });

  it("sorts newest first by event date or filing date", () => {
    const dates = sortFiles(catalog.all, "recent").map((file) =>
      isEvent(file) ? file.date : file.publishedAt,
    );
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it("does not mutate its input", () => {
    const input = [...catalog.all];
    sortFiles(input, "magnitude");
    expect(input).toEqual(catalog.all);
  });
});

describe("counts", () => {
  it("counts the kinds over the whole catalog", () => {
    expect(kindCounts(catalog)).toEqual({ all: 38, trend: 6, event: 32 });
  });

  it("counts each option with the other filters kept but its own facet left out", () => {
    const selected = state({ facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic"] } });
    const counts = facetCounts(catalog, selected);
    const allArctic = catalog.all.filter((file) => file.region === "arctic").length;
    // The region facet ignores its own selection, so every region keeps its full count.
    expect(counts.region.arctic).toBe(allArctic);
    expect(counts.region.africa).toBe(
      catalog.all.filter((file) => file.region === "africa").length,
    );
    // Other facets count inside the Arctic only.
    const sourceTotal = Object.values(counts.src).reduce((a, b) => a + b, 0);
    expect(sourceTotal).toBe(allArctic);
  });

  it("sums each facet's counts to the result size without that facet", () => {
    const counts = facetCounts(catalog, state({ kind: "trend" }));
    for (const values of Object.values(counts)) {
      expect(Object.values(values).reduce((a, b) => a + b, 0)).toBe(6);
    }
    expect(facetValue(byId("svalbard-warming"), "dir")).toBe("up");
  });

  it("counts collections with the collection itself left out", () => {
    const counts = collectionCounts(catalog, state({ col: "space", kind: "trend" }));
    expect(counts.space).toBe(2);
    expect(counts.false).toBe(1);
    expect(counts.records).toBe(0);
  });
});

describe("suggestRelaxation", () => {
  it("names the filter whose removal brings back the most files", () => {
    const impossible = state({
      kind: "trend",
      col: "records",
      facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic"] },
    });
    expect(filterArchive(catalog, impossible)).toHaveLength(0);
    expect(suggestRelaxation(catalog, impossible)).toEqual({
      filter: { type: "col", value: "records" },
      n: 2,
    });
  });

  it("returns null when no single removal helps", () => {
    expect(
      suggestRelaxation(catalog, state({ q: "zzzz", col: "records", kind: "trend" })),
    ).toBeNull();
    expect(suggestRelaxation(catalog, state())).toBeNull();
  });
});

describe("shelfGroups", () => {
  it("puts trend files first, then anomaly files, skipping empty groups", () => {
    const groups = shelfGroups(sortFiles(catalog.all, "magnitude"));
    expect(groups.map((group) => [group.kind, group.files.length])).toEqual([
      ["trend", 6],
      ["event", 32],
    ]);
    expect(shelfGroups(catalog.events).map((group) => group.kind)).toEqual(["event"]);
    expect(shelfGroups([])).toEqual([]);
  });
});
