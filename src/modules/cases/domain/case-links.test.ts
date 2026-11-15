import { describe, expect, it } from "vitest";
import { nextFile, pairFile } from "./case-links";
import { getCaseCatalog } from "./catalog";

const catalog = getCaseCatalog();

describe("nextFile", () => {
  it("follows the catalog order within the same kind", () => {
    const [first, second] = catalog.trends;
    if (!first || !second) throw new Error("expected trend cases");
    expect(nextFile(first, catalog).id).toBe(second.id);
  });

  it("wraps around to the first file", () => {
    const last = catalog.events.at(-1);
    if (!last) throw new Error("expected anomaly files");
    expect(nextFile(last, catalog).id).toBe(catalog.events[0]?.id);
  });

  it("never sends a trend case to an anomaly file", () => {
    for (const file of catalog.trends) expect(nextFile(file, catalog).kind).toBe("trend");
  });
});

describe("pairFile", () => {
  it("finds the opposite-trend case", () => {
    const chile = catalog.trends.find((file) => file.id === "chile-drying");
    if (!chile) throw new Error("missing chile-drying");
    expect(pairFile(chile, catalog)?.id).toBe("sahel-wetting");
  });

  it("is empty without a pair and for anomaly files", () => {
    const svalbard = catalog.trends.find((file) => file.id === "svalbard-warming");
    const event = catalog.events[0];
    if (!svalbard || !event) throw new Error("missing fixtures");
    expect(pairFile(svalbard, catalog)).toBeUndefined();
    expect(pairFile(event, catalog)).toBeUndefined();
  });
});
