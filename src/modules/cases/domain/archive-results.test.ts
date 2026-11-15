import { describe, expect, it } from "vitest";
import { DEFAULT_ARCHIVE_STATE, type ArchiveState } from "./archive";
import {
  filterArchive,
  nearSummary,
  resolveNearSearch,
  shelfGroups,
  sortFiles,
  suggestRelaxation,
  topicCounts,
  topicPool,
} from "./archive-results";
import { fileP, fileSnr, isEvent, type CaseFile } from "./case-file";
import { getCaseCatalog } from "./catalog";
import { kmToFile } from "./near";

const catalog = getCaseCatalog();
const ids = (files: readonly CaseFile[]) => files.map((file) => file.id);
const state = (overrides: Partial<ArchiveState> = {}): ArchiveState => ({
  ...DEFAULT_ARCHIVE_STATE,
  ...overrides,
  facets: { ...DEFAULT_ARCHIVE_STATE.facets, ...overrides.facets },
});

describe("filterArchive", () => {
  it("returns everything by default", () => {
    expect(filterArchive(catalog, state())).toHaveLength(catalog.all.length);
  });

  it("filters by topic", () => {
    expect(filterArchive(catalog, state({ topic: "disasters" })).every(isEvent)).toBe(true);
    expect(filterArchive(catalog, state({ topic: "disasters" }))).toHaveLength(32);
    const heat = filterArchive(catalog, state({ topic: "heat" }));
    expect(ids(heat)).toContain("svalbard-warming");
    expect(heat.every((file) => !isEvent(file) && file.theme === "temperature")).toBe(true);
  });

  it("keeps the old trend kind as a filter", () => {
    expect(filterArchive(catalog, state({ kind: "trend" }))).toHaveLength(6);
  });

  it("ANDs facets with the topic", () => {
    const hits = filterArchive(
      catalog,
      state({ topic: "plants", facets: { ...DEFAULT_ARCHIVE_STATE.facets, region: ["arctic"] } }),
    );
    expect(ids(hits)).toEqual(["tundra-greening"]);
  });

  it("orders the files nearest first around a place", () => {
    const near = { lat: 12.93, lon: -85.92, name: "Matagalpa" };
    const hits = filterArchive(catalog, state({ near }));
    const km = hits.map((file) => kmToFile(near, file));
    expect(km).toEqual([...km].sort((a, b) => a - b));
    expect(hits[0]?.id).toBe("eonet-20409");
    expect(nearSummary(near, hits).isFar).toBe(false);
    const honolulu = { lat: 21.3, lon: -157.85, name: "Honolulu" };
    expect(nearSummary(honolulu, filterArchive(catalog, state({ near: honolulu }))).isFar).toBe(
      true,
    );
  });
});

describe("counts", () => {
  it("counts each topic with the search kept but the topic itself left out", () => {
    const counts = topicCounts(catalog, state({ topic: "heat" }));
    expect(counts.all).toBe(38);
    expect(counts.disasters).toBe(32);
    expect(counts.heat + counts.water + counts.plants).toBe(6);
    const searched = topicCounts(catalog, state({ q: "svalbard" }));
    expect(searched).toMatchObject({ all: 1, heat: 1, disasters: 0 });
  });

  it("sizes the pool under the topic", () => {
    expect(topicPool(catalog, state({ topic: "disasters" }))).toBe(32);
    expect(topicPool(catalog, state())).toBe(38);
  });
});

describe("sortFiles", () => {
  it("sorts by evidence and by magnitude without mutating its input", () => {
    const input = [...catalog.all];
    const byEvidence = sortFiles(input, "evidence").map(fileP);
    expect(byEvidence).toEqual([...byEvidence].sort((a, b) => a - b));
    const byMagnitude = sortFiles(input, "magnitude").map(fileSnr);
    expect(byMagnitude).toEqual([...byMagnitude].sort((a, b) => b - a));
    expect(input).toEqual(catalog.all);
  });
});

describe("suggestRelaxation", () => {
  it("names the filter whose removal brings back the most files", () => {
    const suggestion = suggestRelaxation(catalog, state({ topic: "heat", col: "records" }));
    expect(suggestion?.filter).toEqual({ type: "col", value: "records" });
  });

  it("returns null when nothing is filtered", () => {
    expect(suggestRelaxation(catalog, state())).toBeNull();
  });
});

describe("shelfGroups", () => {
  it("puts trend files first, then anomaly files, skipping empty groups", () => {
    expect(shelfGroups(catalog.all).map((group) => group.kind)).toEqual(["trend", "event"]);
    expect(shelfGroups(catalog.events).map((group) => group.kind)).toEqual(["event"]);
  });
});

describe("resolveNearSearch", () => {
  it("leaves a search that finds files alone", () => {
    expect(resolveNearSearch(catalog, state({ q: "svalbard" })).place).toBe("none");
  });

  it("reads typed coordinates as a place and drops the words", () => {
    const result = resolveNearSearch(catalog, state({ q: "12.93, -85.92" }));
    expect(result.place).toBe("found");
    expect(result.state.q).toBe("");
    expect(result.state.near).toMatchObject({ lat: 12.93, lon: -85.92 });
  });

  it("says when a place cannot be found offline", () => {
    expect(resolveNearSearch(catalog, state({ q: "Matagalpa" }))).toMatchObject({
      place: "not-found",
      text: "Matagalpa",
    });
  });
});
