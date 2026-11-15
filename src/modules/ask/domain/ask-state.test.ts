import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import {
  askHref,
  guidedQuestionIds,
  parseDepth,
  legacyScreen,
  parseHunch,
  parseReading,
  parseScreen,
  resolveQuestion,
  screenNeighbours,
  withRememberedDepth,
} from "./ask-state";
import { getRules } from "./engine";

const catalog = getCaseCatalog();
const findCase = (id: string) => catalog.trends.find((file) => file.id === id);
const rules = getRules();

describe("URL parsing", () => {
  it("reads the screen, falling back to the first one", () => {
    expect(parseScreen({})).toBe("look");
    expect(parseScreen({ s: "check" })).toBe("check");
    expect(parseScreen({ s: "nowhere" })).toBe("look");
  });

  it("lands an old step number on the screen that now holds it", () => {
    const expected = { 2: "look", 3: "look", 4: "guess", 5: "guess", 6: "check", 7: "verdict" };
    for (const [step, screen] of Object.entries(expected)) {
      expect(parseScreen({ step })).toBe(screen);
      expect(legacyScreen({ step })).toBe(screen);
    }
    expect(parseScreen({ step: "8" })).toBe("done");
    expect(parseScreen({ step: "99" })).toBe("look");
    expect(legacyScreen({ step: "99" })).toBeUndefined();
    expect(legacyScreen({})).toBeUndefined();
  });

  it("ignores step values that name Object.prototype members", () => {
    for (const step of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(legacyScreen({ step })).toBeUndefined();
      expect(parseScreen({ step })).toBe("look");
    }
  });

  it("lets a valid screen win over an old step number", () => {
    expect(parseScreen({ s: "verdict", step: "4" })).toBe("verdict");
    expect(legacyScreen({ s: "verdict", step: "4" })).toBeUndefined();
    expect(legacyScreen({ s: "bogus", step: "6" })).toBe("check");
  });

  it("knows the screens on either side", () => {
    expect(screenNeighbours("look")).toEqual({ index: 0, prev: undefined, next: "guess" });
    expect(screenNeighbours("check")).toEqual({ index: 2, prev: "guess", next: "verdict" });
    expect(screenNeighbours("done")).toEqual({ index: 4, prev: "verdict", next: undefined });
  });

  it("accepts only known depths and hunches", () => {
    expect(parseDepth({ depth: "science" })).toBe("science");
    expect(parseDepth({ depth: "deep" }, "guided")).toBe("guided");
    expect(parseHunch({ h: "down" })).toBe("down");
    expect(parseHunch({ h: "sideways" })).toBeUndefined();
    expect(parseReading({ r: "chance" })).toBe("chance");
    expect(parseReading({ r: "maybe" })).toBeUndefined();
  });

  it("builds screen links that keep depth and both answers", () => {
    expect(
      askHref("soil_water@chile-drying", {
        screen: "verdict",
        depth: "guided",
        hunch: "up",
        reading: "real",
      }),
    ).toBe("/ask/soil_water%40chile-drying?s=verdict&depth=guided&h=up&r=real");
    expect(askHref("warmer", { screen: "look", depth: "simple" })).toBe(
      "/ask/warmer?s=look&depth=simple",
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
