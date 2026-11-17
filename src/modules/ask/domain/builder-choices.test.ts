import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import factsData from "../data/facts.json";
import { builderState } from "./builder";
import { spotChoices, splitHint, themeChoices, verbChoices, whereChoices } from "./builder-choices";
import { getRules } from "./engine";

const rules = getRules();
const catalog = getCaseCatalog();
const context = { translator: getTranslator("en"), catalog };
const stateOf = (params: Record<string, string>) => builderState(params, rules, catalog);

describe("splitHint", () => {
  it("moves what stands in brackets to a second line", () => {
    expect(splitHint("natural disasters (fires, storms, floods…)")).toEqual({
      label: "natural disasters",
      hint: "fires, storms, floods…",
    });
    expect(splitHint("rainfall")).toEqual({ label: "rainfall" });
  });
});

describe("builder choices", () => {
  it("colours each theme by its family and marks the chosen one", () => {
    const choices = themeChoices(stateOf({ theme: "rain" }), factsData.themes, context);
    expect(choices.find((choice) => choice.id === "rain")).toEqual({
      id: "rain",
      label: "rainfall",
      short: "Rainfall",
      icon: "rain",
      family: "water",
      isChosen: true,
    });
    expect(choices.find((choice) => choice.id === "events")).toMatchObject({
      label: "natural disasters",
      hint: "fires, storms, floods…",
      short: "Disasters",
      family: "earth",
      isChosen: false,
    });
  });

  it("names the verbs the theme can be asked with", () => {
    const choices = verbChoices(stateOf({ theme: "rain" }), context);
    expect(choices.map((choice) => [choice.id, choice.icon])).toEqual([
      ["trend", "chart"],
      ["anomaly", "warning"],
    ]);
  });

  it("puts an event's date on the quieter line", () => {
    const [first] = whereChoices(stateOf({ theme: "weather" }), context);
    expect(first?.hint).toMatch(/\d{4}/);
    expect(first?.label).not.toContain(" · ");
  });

  it("offers the same places on both sides of a comparison", () => {
    const state = stateOf({ theme: "temperature", verb: "comparison", a: "planet" });
    const choices = spotChoices(state, state.a, context);
    expect(choices.map((choice) => [choice.id, choice.icon, choice.isChosen])).toEqual([
      ["svalbard-warming", "map-pin", false],
      ["planet", "explore", true],
    ]);
  });
});
