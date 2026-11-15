import { describe, expect, it } from "vitest";
import { countOpened, parseIdList, recentFiles, withRead, withRecent } from "./case-progress";

const titles = { a: "File A", b: "File B", c: "File C", d: "File D" };

describe("parseIdList", () => {
  it("reads a stored JSON list of ids", () => {
    expect(parseIdList('["a","b"]')).toEqual(["a", "b"]);
  });

  it("reads missing, corrupt or foreign values as empty", () => {
    expect(parseIdList(null)).toEqual([]);
    expect(parseIdList("not json")).toEqual([]);
    expect(parseIdList('{"a":1}')).toEqual([]);
  });

  it("drops non-string entries and duplicates", () => {
    expect(parseIdList('["a",1,null,"a","","b"]')).toEqual(["a", "b"]);
  });
});

describe("withRecent", () => {
  it("puts the opened file first without repeating it", () => {
    expect(withRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("keeps the five most recent files", () => {
    expect(withRecent(["a", "b", "c", "d", "e"], "f")).toEqual(["f", "a", "b", "c", "d"]);
  });

  it("does not change the list it was given", () => {
    const recent = ["a"];
    withRecent(recent, "b");
    expect(recent).toEqual(["a"]);
  });
});

describe("withRead", () => {
  it("adds a file once", () => {
    expect(withRead(["a"], "b")).toEqual(["a", "b"]);
    expect(withRead(["a", "b"], "a")).toEqual(["a", "b"]);
  });
});

describe("countOpened", () => {
  it("counts only files the catalog still has", () => {
    expect(countOpened(["a", "gone", "c"], titles)).toBe(2);
  });
});

describe("recentFiles", () => {
  it("returns the first three known files with their titles", () => {
    expect(recentFiles(["d", "gone", "a", "b", "c"], titles)).toEqual([
      { id: "d", title: "File D" },
      { id: "a", title: "File A" },
      { id: "b", title: "File B" },
    ]);
  });
});
