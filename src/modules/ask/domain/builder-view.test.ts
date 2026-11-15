import { describe, expect, it } from "vitest";
import { getCaseCatalog, getEventAudit } from "@/modules/cases";
import { builderState } from "./builder";
import { builderSteps, previewLines, themeFamily, whereIcon } from "./builder-view";
import { getRules } from "./engine";

const rules = getRules();
const catalog = getCaseCatalog();
const sources = { ...catalog, audit: getEventAudit() };
const stateOf = (params: Record<string, string>) => builderState(params, rules, catalog);

describe("builderSteps", () => {
  it("opens on the theme with the other two steps locked", () => {
    expect(builderSteps(stateOf({}))).toEqual({
      theme: "current",
      verb: "locked",
      place: "locked",
    });
  });

  it("marks a step done once its choice is made, and the next one current", () => {
    expect(builderSteps(stateOf({ theme: "soil_water" }))).toEqual({
      theme: "done",
      verb: "current",
      place: "locked",
    });
    expect(builderSteps(stateOf({ theme: "soil_water", verb: "trend" })).place).toBe("current");
    expect(builderSteps(stateOf({ theme: "temperature", verb: "trend" })).place).toBe("done");
  });

  it("keeps a comparison open while both sides are the same place", () => {
    const same = stateOf({ theme: "soil_water", verb: "comparison", a: "chile-drying" });
    expect(builderSteps({ ...same, b: "chile-drying", isSameTwice: true }).place).toBe("current");
    const done = stateOf({
      theme: "soil_water",
      verb: "comparison",
      a: "chile-drying",
      b: "sahel-wetting",
    });
    expect(builderSteps(done).place).toBe("done");
  });
});

describe("previewLines", () => {
  it("says nothing before the question can be opened", () => {
    expect(previewLines(stateOf({ theme: "rain" }), sources)).toEqual([]);
  });

  it("names the years and the source of a trend", () => {
    const lines = previewLines(stateOf({ theme: "temperature", verb: "trend" }), sources);
    expect(lines).toEqual([
      { icon: "calendar", key: "ask.prev.years", values: { n: 45, from: 1981, to: 2025 } },
      { icon: "satellite", text: "NASA POWER · MERRA-2" },
      { icon: "check", key: "ask.prev.reviewed" },
    ]);
    const modis = previewLines(
      stateOf({ theme: "greenness", verb: "trend", where: "amazon-browning" }),
      sources,
    );
    expect(modis[1]).toEqual({ icon: "satellite", text: "MODIS/Terra · NASA" });
  });

  it("reads an anomaly window, a comparison and an audit", () => {
    const anomaly = previewLines(
      stateOf({ theme: "weather", verb: "anomaly", where: "eonet-24723" }),
      sources,
    );
    expect(anomaly[0]).toMatchObject({ key: "ask.prev.anom", values: { days: 90 } });
    const comparison = stateOf({
      theme: "soil_water",
      verb: "comparison",
      where: "chile-drying~sahel-wetting",
    });
    expect(previewLines(comparison, sources).map((line) => "key" in line && line.key)).toEqual([
      "ask.prev.cmp",
      "ask.prev.reviewed",
    ]);
    const audit = previewLines(stateOf({ theme: "events", where: "floods" }), sources);
    expect(audit).toEqual([
      { icon: "audit", key: "ask.prev.audit", values: { from: 2000, to: 2025 } },
    ]);
  });
});

describe("icons and families", () => {
  it("falls back to the earth family for an unknown theme", () => {
    const themes = [{ id: "rain", family: "water" }];
    expect(themeFamily(themes, "rain")).toBe("water");
    expect(themeFamily(themes, "nope")).toBe("earth");
  });

  it("draws an event with a calendar and a category with layers", () => {
    const [event] = stateOf({ theme: "weather" }).wheres;
    const [category] = stateOf({ theme: "events" }).wheres;
    expect(event && whereIcon(event)).toBe("calendar");
    expect(category && whereIcon(category)).toBe("layers");
  });
});
