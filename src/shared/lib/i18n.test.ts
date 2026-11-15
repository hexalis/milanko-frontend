import { describe, expect, it } from "vitest";
import { createTranslator, interpolate, isLocale } from "./i18n";

const catalog = {
  en: { hello: "Hello {name}", only: "English only" },
  es: { hello: "Hola {name}" },
};

describe("createTranslator", () => {
  it("translates and interpolates", () => {
    expect(createTranslator(catalog, "es").t("hello", { name: "Ana" })).toBe("Hola Ana");
  });

  it("falls back to English, then to the key", () => {
    const { t } = createTranslator(catalog, "es");
    expect(t("only")).toBe("English only");
    expect(t("missing.key")).toBe("missing.key");
  });

  it("reports whether a key exists in English", () => {
    const { has } = createTranslator(catalog, "es");
    expect(has("only")).toBe(true);
    expect(has("nope")).toBe(false);
  });
});

describe("interpolate", () => {
  it("keeps unknown placeholders", () => {
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});

describe("isLocale", () => {
  it("accepts only supported languages", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
