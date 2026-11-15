import { describe, expect, it } from "vitest";
import { shortcutFor } from "./shortcuts";

const press = (key: string, target: EventTarget | null = document.body, modifiers = {}) =>
  shortcutFor({ key, metaKey: false, ctrlKey: false, altKey: false, target, ...modifiers });

describe("shortcutFor", () => {
  it("maps / to search and [ to collapse", () => {
    expect(press("/")).toBe("search");
    expect(press("[")).toBe("collapse");
    expect(press("a")).toBeNull();
  });

  it("ignores the keys while the reader types", () => {
    expect(press("/", document.createElement("input"))).toBeNull();
    expect(press("[", document.createElement("textarea"))).toBeNull();
    expect(press("/", document.createElement("select"))).toBeNull();
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(press("/", editable)).toBeNull();
  });

  it("leaves modified keys to the browser", () => {
    expect(press("/", document.body, { ctrlKey: true })).toBeNull();
    expect(press("[", document.body, { metaKey: true })).toBeNull();
  });
});
