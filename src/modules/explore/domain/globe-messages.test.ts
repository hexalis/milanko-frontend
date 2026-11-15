import { describe, expect, it, vi } from "vitest";
import {
  createCommandQueue,
  isFromFrame,
  parseGlobeEvent,
  parseGlobeMessage,
  type FrameCommand,
} from "./globe-messages";

const EVENT = {
  lon: 145.65,
  lat: -23.14,
  cat: "wildfires",
  date: "2025-01-01",
  title: "Wildfire in Australia 1023209",
  src: "GDACS",
  id: "EONET_12289",
  mag: null,
  unit: "",
};

describe("parseGlobeMessage", () => {
  it("ignores anything without the etd marker", () => {
    expect(parseGlobeMessage({ type: "ready" })).toBeNull();
    expect(parseGlobeMessage("ready")).toBeNull();
    expect(parseGlobeMessage(null)).toBeNull();
    expect(parseGlobeMessage({ etd: 1, type: "unknown" })).toBeNull();
  });

  it("reads ready and escape", () => {
    expect(parseGlobeMessage({ etd: 1, type: "ready" })).toEqual({ type: "ready" });
    expect(parseGlobeMessage({ etd: 1, type: "escape" })).toEqual({ type: "escape" });
  });

  it("reads where the globe's controls sit, keeping only well-formed known boxes", () => {
    const rects = {
      search: [24, 24, 440, 48],
      zoom: [851, 24, 44, 140],
      layers: [100, 500, 0, 120],
      regions: [24, 84, "wide", 36],
      dock: [0, 0, 10, 10],
    };
    expect(parseGlobeMessage({ etd: 1, type: "chrome", rects })).toEqual({
      type: "chrome",
      rects: {
        search: { left: 24, top: 24, width: 440, height: 48 },
        zoom: { left: 851, top: 24, width: 44, height: 140 },
      },
    });
    expect(parseGlobeMessage({ etd: 1, type: "chrome", rects: "x" })).toEqual({
      type: "chrome",
      rects: {},
    });
  });

  it("reads each kind of selection", () => {
    expect(
      parseGlobeMessage({ etd: 1, type: "select", sel: { type: "case", id: "svalbard-warming" } }),
    ).toEqual({
      type: "select",
      sel: { type: "case", id: "svalbard-warming" },
    });
    expect(
      parseGlobeMessage({ etd: 1, type: "select", sel: { type: "sector", id: "europe" } }),
    ).toEqual({ type: "select", sel: { type: "sector", id: "europe" } });
    expect(
      parseGlobeMessage({ etd: 1, type: "select", sel: { type: "point", lat: 10.5, lon: -20 } }),
    ).toEqual({ type: "select", sel: { type: "point", lat: 10.5, lon: -20 } });
    expect(
      parseGlobeMessage({ etd: 1, type: "select", sel: { type: "event", ev: EVENT } }),
    ).toEqual({
      type: "select",
      sel: { type: "event", ev: EVENT },
    });
  });

  it("rejects selections with bad ids or coordinates", () => {
    const bad = [
      { type: "sector", id: "atlantis" },
      { type: "case", id: "<script>" },
      { type: "point", lat: 95, lon: 0 },
      { type: "point", lat: 0, lon: "10" },
      { type: "event", ev: { ...EVENT, date: "yesterday" } },
    ];
    for (const sel of bad) expect(parseGlobeMessage({ etd: 1, type: "select", sel })).toBeNull();
  });

  it("reads a tile and drops malformed category rows", () => {
    const message = parseGlobeMessage({
      etd: 1,
      type: "tile",
      lat: 1,
      lon: 2,
      km: 55,
      n: 3,
      cats: [["wildfires", 2], ["floods", 1], ["bad"]],
      latest: { title: "Flood", date: "2025-03-04T00:00:00Z" },
      period: { kind: "year", y: 2025 },
    });
    expect(message).toEqual({
      type: "tile",
      lat: 1,
      lon: 2,
      km: 55,
      n: 3,
      cats: [
        ["wildfires", 2],
        ["floods", 1],
      ],
      latest: { title: "Flood", date: "2025-03-04" },
      period: { kind: "year", y: 2025 },
    });
  });

  it("rejects a tile without a period", () => {
    expect(
      parseGlobeMessage({ etd: 1, type: "tile", lat: 1, lon: 2, km: 55, n: 0, cats: [] }),
    ).toBeNull();
  });
});

describe("parseGlobeEvent", () => {
  it("keeps a numeric magnitude and trims the date to the day", () => {
    expect(
      parseGlobeEvent({ ...EVENT, mag: 65, unit: "kts", date: "2025-09-01T12:00:00Z" }),
    ).toMatchObject({ mag: 65, unit: "kts", date: "2025-09-01" });
  });
});

describe("isFromFrame", () => {
  const frame = {};
  it("accepts only the frame's window, from its sandboxed (opaque) origin", () => {
    expect(isFromFrame({ source: frame, origin: "null" }, frame)).toBe(true);
    expect(isFromFrame({ source: {}, origin: "null" }, frame)).toBe(false);
    // An unsandboxed page (another site, or the globe opened without the sandbox) is not the frame.
    expect(isFromFrame({ source: frame, origin: "http://a" }, frame)).toBe(false);
    expect(isFromFrame({ source: null, origin: "null" }, null)).toBe(false);
  });
});

describe("createCommandQueue", () => {
  it("holds commands until ready, then sends them in order and passes later ones through", () => {
    const post = vi.fn<(command: FrameCommand) => void>();
    const queue = createCommandQueue();
    queue.send({ type: "closed" });
    queue.send({ type: "focus" });
    expect(post).not.toHaveBeenCalled();
    queue.ready(post);
    expect(post.mock.calls.map(([command]) => command.type)).toEqual(["closed", "focus"]);
    queue.send({ type: "inset", side: "right", px: 400 });
    expect(post).toHaveBeenCalledTimes(3);
  });
});
