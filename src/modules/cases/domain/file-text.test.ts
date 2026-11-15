import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { getCaseCatalog } from "./catalog";
import { eventTitle } from "./event-title";
import { changeLabel, eventHeadline, fileTitle, trendVars, verdictLabel } from "./file-text";

const catalog = getCaseCatalog();
const en = { translator: getTranslator("en"), catalog };
const es = { translator: getTranslator("es"), catalog };
const byId = (id: string) => {
  const file = catalog.all.find((candidate) => candidate.id === id);
  if (!file) throw new Error(`missing ${id}`);
  return file;
};

describe("catalog", () => {
  it("loads the 6 trend cases and 32 anomaly files", () => {
    expect(catalog.trends).toHaveLength(6);
    expect(catalog.events).toHaveLength(32);
    expect(catalog.eventWindowDays).toBe(90);
  });

  it("keeps the POC verdicts: 5 confirmed trends, Murray-Darling inconclusive", () => {
    const inconclusive = catalog.trends
      .filter((file) => !file.t.significant)
      .map((file) => file.id);
    expect(inconclusive).toEqual(["murray-rain"]);
  });
});

describe("trend wording", () => {
  it("fills the narrative from the data, never leaving placeholders", () => {
    const svalbard = byId("svalbard-warming");
    if (svalbard.kind !== "trend") throw new Error("expected a trend");
    const title = fileTitle(svalbard, en);
    expect(title).not.toMatch(/\{\w+\}/);
    expect(title).toContain(String(trendVars(svalbard, { catalog }).factor));
  });

  it("writes relative changes as a percentage", () => {
    const chile = byId("chile-drying");
    if (chile.kind !== "trend") throw new Error("expected a trend");
    expect(changeLabel(chile, en)).toMatch(/^−\d+ %$/);
  });

  it("translates verdicts", () => {
    expect(verdictLabel(byId("murray-rain"), es)).toBe("No concluyente");
  });
});

describe("anomaly wording", () => {
  it("speaks of records and ranks", () => {
    expect(eventHeadline("tmax", { rank: 1, years: 45, from: 1981 }, en)).not.toMatch(/\{\w+\}/);
    expect(eventHeadline("rain", { rank: 5, years: 45, from: 1981 }, en)).toContain("40");
  });

  it("rebuilds EONET titles in Spanish", () => {
    expect(eventTitle("Wildfire in Spain", "es")).toBe("Incendio en España");
    expect(eventTitle("Etna Volcano, Italy", "es")).toBe("Volcán Etna, Italia");
    expect(eventTitle("Tropical Storm Alpha", "es")).toBe("Tormenta tropical Alpha");
    expect(eventTitle("Wildfire in Spain", "en")).toBe("Wildfire in Spain");
  });
});
