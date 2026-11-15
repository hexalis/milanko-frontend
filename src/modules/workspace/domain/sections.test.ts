import { describe, expect, it } from "vitest";
import { activeSection, TABBAR } from "./sections";

describe("activeSection", () => {
  it("marks home only on the root path", () => {
    expect(activeSection("/")).toBe("/");
    expect(activeSection("/ask")).not.toBe("/");
  });

  it("keeps a section active on the pages under it", () => {
    expect(activeSection("/cases")).toBe("/cases");
    expect(activeSection("/cases/svalbard-warming")).toBe("/cases");
    expect(activeSection("/ask/compare")).toBe("/ask");
    expect(activeSection("/ask/q-123")).toBe("/ask");
    expect(activeSection("/regions/ART")).toBe("/regions");
    expect(activeSection("/events/EONET_1")).toBe("/events");
  });

  it("ignores a trailing slash", () => {
    expect(activeSection("/briefing/")).toBe("/briefing");
  });

  it("does not match a path that only shares a prefix", () => {
    expect(activeSection("/casesx")).toBeNull();
    expect(activeSection("/teamwork")).toBeNull();
  });

  it("has no section for an unknown path", () => {
    expect(activeSection("/nowhere")).toBeNull();
  });
});

describe("TABBAR", () => {
  it("offers the five phone destinations of the POC", () => {
    expect(TABBAR.map((entry) => entry.href)).toEqual([
      "/",
      "/ask",
      "/cases",
      "/explore",
      "/method",
    ]);
  });
});
