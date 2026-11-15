import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import {
  askHref,
  guidedQuestionIds,
  parseDepth,
  parseHunch,
  parseStep,
  resolveQuestion,
  withRememberedDepth,
} from "./ask-state";
import { getRules } from "./engine";

const catalog = getCaseCatalog();
const findCase = (id: string) => catalog.trends.find((file) => file.id === id);
const rules = getRules();

describe("URL parsing", () => {
  it("clamps the step to the guided range", () => {
    expect(parseStep({})).toBe(2);
    expect(parseStep({ step: "5" })).toBe(5);
    expect(parseStep({ step: "1" })).toBe(2);
    expect(parseStep({ step: "99" })).toBe(8);
    expect(parseStep({ step: "x" })).toBe(2);
  });

  it("accepts only known depths and hunches", () => {
    expect(parseDepth({ depth: "science" })).toBe("science");
    expect(parseDepth({ depth: "deep" }, "guided")).toBe("guided");
    expect(parseHunch({ h: "down" })).toBe("down");
    expect(parseHunch({ h: "sideways" })).toBeUndefined();
  });

  it("builds step links that keep depth and hunch", () => {
    expect(askHref("soil_water@chile-drying", { step: 4, depth: "guided", hunch: "up" })).toBe(
      "/ask/soil_water%40chile-drying?step=4&depth=guided&h=up",
    );
  });
});

describe("resolveQuestion", () => {
  it("opens published and composed POWER trend questions", () => {
    expect(resolveQuestion(rules, "warmer", findCase)?.case).toBe("svalbard-warming");
    expect(resolveQuestion(rules, "soil_water@chile-drying", findCase)?.variable).toBe("GWETROOT");
  });

  it("refuses MODIS cases, unknown places and malformed ids", () => {
    expect(resolveQuestion(rules, "greenness@amazon-browning", findCase)).toBeUndefined();
    expect(resolveQuestion(rules, "rain@nowhere", findCase)).toBeUndefined();
    expect(resolveQuestion(rules, "a@b@c", findCase)).toBeUndefined();
    expect(resolveQuestion(rules, "nope", findCase)).toBeUndefined();
  });

  it("lists every guided id for static generation", () => {
    const ids = guidedQuestionIds(rules, findCase);
    expect(ids).toContain("warmer");
    expect(ids).toContain("rainfall");
    expect(ids).toContain("soil_water@chile-drying");
    expect(ids.every((id) => resolveQuestion(rules, id, findCase))).toBe(true);
  });
});

describe("withRememberedDepth", () => {
  it("fills the depth from the cookie only when the URL has none", () => {
    expect(withRememberedDepth({ theme: "rain" }, "science")).toEqual({
      theme: "rain",
      depth: "science",
    });
    expect(withRememberedDepth({ depth: "guided" }, "science")).toEqual({ depth: "guided" });
    expect(withRememberedDepth({}, "bogus")).toEqual({});
    expect(withRememberedDepth({}, undefined)).toEqual({});
  });
});
