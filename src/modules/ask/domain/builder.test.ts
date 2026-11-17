import { compareHref } from "./compare";
import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import factsData from "../data/facts.json";
import {
  builderExamples,
  builderState,
  builderTypes,
  MINE,
  staleSegments,
  whereOptions,
} from "./builder";
import { getRules } from "./engine";
import type { Facts } from "./rules";

const rules = getRules();
const catalog = getCaseCatalog();
const examples = (factsData as unknown as Facts).examples;

describe("builderState: theme → verb → place, invalid pieces dropped", () => {
  it("starts empty and lists only ready themes", () => {
    const state = builderState({}, rules, catalog);
    expect(state.themes).toEqual(rules.ready().map((row) => row.theme));
    expect(state).toMatchObject({
      depth: "simple",
      theme: undefined,
      types: [],
      type: undefined,
      wheres: [],
      where: undefined,
      go: undefined,
      isSameTwice: false,
      hasNoFreePoint: false,
    });
  });

  it("drops an unknown theme and everything after it", () => {
    const state = builderState(
      { theme: "volcano_mood", verb: "trend", where: "svalbard-warming" },
      rules,
      catalog,
    );
    expect(state.theme).toBeUndefined();
    expect(state.type).toBeUndefined();
    expect(state.where).toBeUndefined();
  });

  it("auto-selects the only verb, and offers the reader's own place beside a reviewed one", () => {
    expect(builderState({ theme: "events" }, rules, catalog).type).toBe("catalog");
    expect(builderState({ theme: "rain" }, rules, catalog).type).toBeUndefined();
    const open = builderState({ theme: "rain", verb: "trend" }, rules, catalog);
    expect(open.types).toEqual(["trend", "anomaly"]);
    expect(open.wheres.map((option) => option.id)).toEqual(["murray-rain", MINE]);
    expect(open.where).toBeUndefined();
    const state = builderState(
      { theme: "rain", verb: "trend", where: "murray-rain" },
      rules,
      catalog,
    );
    expect(state.go).toEqual({ href: "/ask/rainfall?s=look&depth=simple", kind: "guided" });
  });

  it("opens the reader's own place only once it has been found", () => {
    const searching = builderState({ theme: "rain", verb: "trend", where: MINE }, rules, catalog);
    expect(searching.where?.id).toBe(MINE);
    expect(searching.go).toBeUndefined();
    expect(searching.point).toBeUndefined();
    const found = builderState(
      {
        theme: "rain",
        verb: "trend",
        where: MINE,
        lat: "12.927",
        lon: "-85.919",
        name: "Matagalpa",
      },
      rules,
      catalog,
    );
    expect(found.point).toEqual({ lat: 12.93, lon: -85.92, name: "Matagalpa" });
    expect(found.where?.subject).toEqual({ type: "point", name: "Matagalpa" });
    expect(found.go).toEqual({
      href: "/place?lat=12.93&lon=-85.92&name=Matagalpa&var=PRECTOTCORR",
      kind: "place",
    });
    // A point left in the URL means nothing once another place is chosen.
    const reviewed = builderState(
      { theme: "rain", verb: "trend", where: "murray-rain", lat: "1", lon: "2" },
      rules,
      catalog,
    );
    expect(reviewed.point).toBeUndefined();
  });

  it("offers no own place where a variable cannot be read live", () => {
    const anomaly = builderState({ theme: "weather", verb: "anomaly" }, rules, catalog);
    expect(anomaly.wheres.some((option) => option.id === MINE)).toBe(false);
  });

  it("offers a comparison only between two reviewed places", () => {
    expect(builderTypes(rules, "rain")).toEqual(["trend", "anomaly"]);
  });

  it("offers comparison when the theme is comparable and drops a verb the theme lacks", () => {
    expect(builderTypes(rules, "temperature")).toEqual(["trend", "comparison", "anomaly"]);
    const state = builderState({ theme: "temperature", verb: "catalog" }, rules, catalog);
    expect(state.type).toBeUndefined();
    expect(state.where).toBeUndefined();
    expect(state.go).toBeUndefined();
  });

  it("drops a place that does not belong to the verb", () => {
    const state = builderState(
      { theme: "weather", verb: "anomaly", where: "svalbard-warming" },
      rules,
      catalog,
    );
    expect(state.type).toBe("anomaly");
    expect(state.wheres.length).toBeGreaterThan(1);
    expect(state.where).toBeUndefined();
    expect(state.go).toBeUndefined();
  });

  it("keeps the depth from the URL and falls back to simple", () => {
    expect(
      builderState(
        { theme: "rain", verb: "trend", where: "murray-rain", depth: "science" },
        rules,
        catalog,
      ).go?.href,
    ).toBe("/ask/rainfall?s=look&depth=science");
    expect(builderState({ depth: "deep" }, rules, catalog).depth).toBe("simple");
  });

  it("opens a MODIS trend as its case file, not as a guided flow", () => {
    const state = builderState({ theme: "greenness", verb: "trend" }, rules, catalog);
    const modis = state.wheres.find((option) => option.kind === "case");
    expect(modis).toBeDefined();
    expect(modis?.href).toBe(`/cases/${modis?.id}`);
  });

  it("opens an anomaly as its case file", () => {
    const state = builderState(
      { theme: "weather", verb: "anomaly", where: "eonet-24723" },
      rules,
      catalog,
    );
    expect(state.go).toEqual({ href: "/cases/eonet-24723", kind: "case" });
    expect(state.variables).toEqual(["T2M_MAX", "PRECTOTCORR", "GWETROOT"]);
    expect(state.hasNoFreePoint).toBe(true);
  });

  it("points a catalog question at the anomaly archive and needs no free-point note", () => {
    const state = builderState({ theme: "events" }, rules, catalog);
    expect(state.type).toBe("catalog");
    expect(state.wheres.length).toBeGreaterThan(0);
    expect(state.wheres.every((option) => option.href === "/cases?kind=event")).toBe(true);
    expect(state.hasNoFreePoint).toBe(false);
  });
});

describe("builderState: comparison", () => {
  it("reads both places from an example's where=a~b", () => {
    const state = builderState(
      { theme: "soil_water", verb: "comparison", where: "chile-drying~sahel-wetting" },
      rules,
      catalog,
    );
    expect(state.spots).toEqual(["chile-drying", "sahel-wetting"]);
    expect([state.a, state.b]).toEqual(["chile-drying", "sahel-wetting"]);
    expect(state.wheres).toEqual([]);
    expect(state.go).toEqual({
      href: "/ask/compare?theme=soil_water&a=chile-drying&b=sahel-wetting&depth=simple",
      kind: "compare",
    });
    expect(state.hasNoFreePoint).toBe(true);
  });

  it("lets a and b win over where, and drops unknown places", () => {
    const state = builderState(
      { theme: "temperature", verb: "comparison", a: "planet", b: "atlantis", where: "x~y" },
      rules,
      catalog,
    );
    expect(state.spots).toContain("planet");
    expect(state.a).toBe("planet");
    expect(state.b).toBeUndefined();
    expect(state.go).toBeUndefined();
  });

  it("refuses the same place twice", () => {
    const state = builderState(
      { theme: "soil_water", verb: "comparison", a: "chile-drying", b: "chile-drying" },
      rules,
      catalog,
    );
    expect(state.isSameTwice).toBe(true);
    expect(state.go).toBeUndefined();
  });
});

describe("whereOptions", () => {
  it("leaves the planet out of trend places but keeps it in comparison pairs", () => {
    const trend = whereOptions(rules, catalog, {
      theme: "temperature",
      type: "trend",
      depth: "guided",
    });
    expect(trend.map((option) => option.id)).toEqual(["svalbard-warming", MINE]);
    expect(trend[0]?.href).toBe("/ask/warmer?s=look&depth=guided");
    expect(trend[1]).toMatchObject({ kind: "place", href: "" });
    const pairs = whereOptions(rules, catalog, {
      theme: "temperature",
      type: "comparison",
      depth: "simple",
    });
    expect(pairs[0]).toMatchObject({ id: "svalbard-warming~planet", kind: "compare" });
  });

  it("sorts anomaly files newest first", () => {
    const dates = whereOptions(rules, catalog, {
      theme: "weather",
      type: "anomaly",
      depth: "simple",
    }).map((option) => catalog.events.find((event) => event.id === option.id)?.date ?? "");
    expect(dates).toEqual(dates.toSorted().reverse());
  });
});

describe("builderExamples", () => {
  it("shows every example the rules can answer, linked on the builder's path", () => {
    const state = builderState({}, rules, catalog);
    const shown = builderExamples(examples, { state, rules, cases: catalog, path: "/ask" });
    expect(shown.map((example) => example.where)).toEqual([
      "svalbard-warming",
      "murray-rain",
      "chile-drying~sahel-wetting",
      "eonet-24723",
    ]);
    expect(shown[0]?.href).toBe(
      "/ask?theme=temperature&verb=trend&where=svalbard-warming&depth=simple",
    );
    expect(shown.every((example) => !example.isActive)).toBe(true);
  });

  it("hides examples the rules can no longer answer", () => {
    const state = builderState({}, rules, catalog);
    const stale = [{ theme: "rain", type: "trend" as const, where: "atlantis" }];
    expect(builderExamples(stale, { state, rules, cases: catalog, path: "/" })).toEqual([]);
  });

  it("marks the example that matches the question being built", () => {
    const state = builderState(
      { theme: "rain", verb: "trend", where: "murray-rain" },
      rules,
      catalog,
    );
    const shown = builderExamples(examples, { state, rules, cases: catalog, path: "/" });
    expect(shown.filter((example) => example.isActive).map((example) => example.where)).toEqual([
      "murray-rain",
    ]);
    const comparison = builderState(
      { theme: "soil_water", verb: "comparison", a: "chile-drying", b: "sahel-wetting" },
      rules,
      catalog,
    );
    const active = builderExamples(examples, {
      state: comparison,
      rules,
      cases: catalog,
      path: "/",
    })
      .filter((example) => example.isActive)
      .map((example) => example.where);
    expect(active).toEqual(["chile-drying~sahel-wetting"]);
  });
});

describe("helpers", () => {
  it("resets the later segments like the POC, the reader's own place included", () => {
    expect(staleSegments("theme")).toEqual(["verb", "where", "a", "b", "lat", "lon", "name"]);
    expect(staleSegments("verb")).toEqual(["where", "a", "b", "lat", "lon", "name"]);
    expect(staleSegments("where")).toEqual(["lat", "lon", "name"]);
    expect(staleSegments("a")).toEqual([]);
  });

  it("builds comparison links", () => {
    expect(compareHref({ theme: "rain", a: "a", b: "b", depth: "guided" })).toBe(
      "/ask/compare?theme=rain&a=a&b=b&depth=guided",
    );
  });
});
