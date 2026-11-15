import { describe, expect, it } from "vitest";
import { getTranslator } from "@/modules/copy";
import { categoryName, exploreTranslator, pickExploreMessages } from "./explore-copy";

describe("pickExploreMessages", () => {
  it("resolves every drawer key in the reader's language", () => {
    const messages = pickExploreMessages(getTranslator("es"));
    // A key the catalog lacks would come back as itself.
    const missing = Object.entries(messages).filter(([key, value]) => value === key);
    expect(missing).toEqual([]);
    expect(messages["reg.europe"]).toBe("Europa");
  });
});

describe("exploreTranslator", () => {
  const t = exploreTranslator(pickExploreMessages(getTranslator("en")));

  it("fills placeholders", () => {
    expect(t("exp.sector.files", { n: 4 })).toBe("4 case files");
  });

  it("returns unknown keys as written", () => {
    expect(t("nope.key")).toBe("nope.key");
    expect(categoryName(t, "aliens")).toBe("aliens");
    expect(categoryName(t, "wildfires")).toBe("Wildfires");
  });
});
