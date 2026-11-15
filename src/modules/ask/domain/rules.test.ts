import { describe, expect, it } from "vitest";
import { getCaseCatalog, getEventAudit } from "@/modules/cases";
import factsData from "../data/facts.json";
import { servableFacts } from "./engine";
import { reviewedFrom } from "./reviewed";
import { createRules, QUESTION_TYPES, type Facts } from "./rules";

// Same checks as the POC's scripts/test_rules.mjs, against the same data files.
const facts = factsData as unknown as Facts;
const catalog = getCaseCatalog();
const reviewed = reviewedFrom({
  trends: catalog.trends,
  global: { variable: catalog.global.variable, hasTrend: true },
  events: catalog.events,
  auditCategories: getEventAudit().categories,
});
const rules = createRules(facts, reviewed);

describe("rules engine (POC test_rules.mjs)", () => {
  it("deduces the status matrix: 12 ready, 5 draft, 10 candidate", () => {
    const count = { ready: 0, draft: 0, candidate: 0 };
    for (const row of rules.matrix()) {
      for (const type of QUESTION_TYPES) {
        const status = row.cells[type];
        if (status) count[status] += 1;
      }
    }
    expect(count).toEqual({ ready: 12, draft: 5, candidate: 10 });
  });

  it("rule 2: offers a place only where every main variable is reviewed", () => {
    expect(rules.places("temperature", "trend")).toEqual(["svalbard-warming", "planet"]);
    expect(rules.places("rain", "trend")).toEqual(["murray-rain"]);
    expect(rules.places("water_available", "trend")).toEqual([]);
    expect(rules.places("weather", "anomaly")).toHaveLength(25);
  });

  it("rule 3: a comparison appears when a theme has two places", () => {
    expect(rules.status("rain", "comparison")).toBe("draft");
    expect(rules.pairs("soil_water")).toEqual([["chile-drying", "sahel-wetting"]]);
  });

  it("rule 4: a free point needs every main variable computable live", () => {
    expect(rules.allowsFreePoint("temperature", "trend")).toBe(true);
    expect(rules.allowsFreePoint("greenness", "trend")).toBe(false);
    expect(rules.allowsFreePoint("weather", "anomaly")).toBe(true);
  });

  it("rule 1: a pair exists only with a declared main variable", () => {
    expect(rules.exists("greenness", "anomaly")).toBe(false);
  });

  it("rule 6: never a combined figure, only which variables support the answer", () => {
    const confirmed = (reading: string) => ({ verdict: "confirmed" as const, reading });
    const inconclusive = { verdict: "inconclusive" as const };
    const notEvaluable = { verdict: "not_evaluable" as const };
    expect(rules.synthesis([confirmed("more_water"), confirmed("more_water")])).toBe("supported");
    expect(rules.synthesis([confirmed("more_water"), inconclusive])).toBe("partial");
    expect(rules.synthesis([inconclusive, inconclusive])).toBe("inconclusive");
    expect(rules.synthesis([confirmed("more_water"), confirmed("less_water")])).toBe("opposed");
    expect(rules.synthesis([notEvaluable, notEvaluable])).toBe("not_evaluable");
    expect(rules.synthesis([confirmed("more_water"), notEvaluable])).toBe("supported");
  });

  it("shows the two published MVP questions, each on its reviewed case", () => {
    expect(rules.questions().map((q) => [q.id, q.case, q.variable, q.theme])).toEqual([
      ["warmer", "svalbard-warming", "T2M", "temperature"],
      ["rainfall", "murray-rain", "PRECTOTCORR", "water"],
    ]);
  });

  it("builds questions from segments; published ones keep their id", () => {
    expect(rules.ready().map((row) => row.theme)).toEqual([
      "temperature",
      "rain",
      "soil_water",
      "greenness",
      "weather",
      "events",
    ]);
    expect(rules.question("soil_water", "trend", "chile-drying").id).toBe(
      "soil_water@chile-drying",
    );
    expect(rules.question("temperature", "trend", "svalbard-warming").id).toBe("warmer");
    expect(rules.mains("weather", "anomaly")).toEqual(["T2M_MAX", "PRECTOTCORR", "GWETROOT"]);
  });

  it("flags documented quality cautions by region", () => {
    for (const caution of facts.cautions) {
      const [latMin = 0, latMax = 0] = caution.box.lat;
      const [lonMin = 0, lonMax = 0] = caution.box.lon;
      const inside = rules.cautions((latMin + latMax) / 2, (lonMin + lonMax) / 2);
      expect(inside.map((match) => match.id)).toContain(caution.id);
    }
    expect(rules.cautions(89, 179)).toEqual([]);
  });
});

describe("servable facts (no live computation yet)", () => {
  const served = createRules(servableFacts(facts), reviewed);

  it("turns rule 4 off so the builder offers reviewed places only", () => {
    expect(served.allowsFreePoint("temperature", "trend")).toBe(false);
    expect(served.allowsFreePoint("weather", "anomaly")).toBe(false);
  });

  it("keeps every reviewed question available", () => {
    expect(served.places("temperature", "trend")).toEqual(["svalbard-warming", "planet"]);
    expect(served.pairs("soil_water")).toEqual([["chile-drying", "sahel-wetting"]]);
    expect(served.comparable("rain")).toBe(false);
  });
});
