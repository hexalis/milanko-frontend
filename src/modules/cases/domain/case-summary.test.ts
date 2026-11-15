import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { getCaseCatalog } from "./catalog";
import { getCaseSummaries } from "./case-summary";

const catalog = getCaseCatalog();

describe("getCaseSummaries", () => {
  it("summarizes every file of the catalog", () => {
    expect(getCaseSummaries(catalog, getTranslator("en"))).toHaveLength(catalog.all.length);
  });

  it("words a trend file in the reader's language", () => {
    const en = getCaseSummaries(catalog, getTranslator("en")).find(
      (file) => file.id === "svalbard-warming",
    );
    expect(en).toMatchObject({
      kind: "trend",
      catalog: "ETD-2026-001",
      region: "arctic",
      themeLabel: "Temperature",
      verdict: "confirmed",
      verdictLabel: "Confirmed",
      figureNote: "per decade",
      category: null,
    });
    expect(en?.title).toMatch(/Svalbard is warming/);
    expect(en?.trend).not.toBeNull();

    const es = getCaseSummaries(catalog, getTranslator("es")).find(
      (file) => file.id === "svalbard-warming",
    );
    expect(es?.title).toMatch(/Svalbard se calienta/);
  });

  it("gives an anomaly file its category and run-up figure", () => {
    const event = catalog.events[0];
    if (!event) throw new Error("no anomaly files");
    const summary = getCaseSummaries(catalog, getTranslator("en")).find(
      (file) => file.id === event.id,
    );
    expect(summary).toMatchObject({ kind: "event", category: event.category, trend: null });
    expect(summary?.series).toHaveLength(event.lv.series.length);
    expect(summary?.summary).not.toBe("");
  });
});
