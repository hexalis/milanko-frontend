import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeSearch, searchTerms } from "./archive-search";
import type { CaseFile } from "./case-file";
import { getCaseCatalog } from "./catalog";

const catalog = getCaseCatalog();
const byId = (id: string): CaseFile => {
  const file = catalog.all.find((candidate) => candidate.id === id);
  if (!file) throw new Error(`missing ${id}`);
  return file;
};

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
