import { describe, expect, it } from "vitest";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { builderState } from "./builder";
import {
  builderSentence,
  exampleText,
  placeIn,
  placeName,
  sentencePieces,
  variableName,
  whereLabel,
} from "./builder-text";
import { getRules } from "./engine";

const rules = getRules();
const catalog = getCaseCatalog();
const en = { translator: getTranslator("en"), catalog };
const es = { translator: getTranslator("es"), catalog };

const text = (pieces: ReturnType<typeof sentencePieces>) =>
  pieces.map((piece) => (piece.kind === "gap" ? "…" : piece.text)).join("");

describe("builder text", () => {
  it("splits a pattern into words and open gaps", () => {
    expect(sentencePieces("Has {theme} changed {place}?")).toEqual([
      { kind: "text", text: "Has " },
      { kind: "gap" },
      { kind: "text", text: " changed " },
      { kind: "gap" },
      { kind: "text", text: "?" },
    ]);
  });

  it("asks the reader to choose before any theme", () => {
    expect(text(builderSentence(builderState({}, rules, catalog), en))).toBe(
      "Choose what you want to ask about.",
    );
  });

  it("leaves the place as a gap until it is chosen", () => {
    const state = builderState({ theme: "weather", verb: "anomaly" }, rules, catalog);
    const pieces = builderSentence(state, en);
    expect(pieces.at(-2)).toEqual({ kind: "gap" });
    expect(text(pieces)).toBe("Was the weather out of the ordinary before …?");
  });

  it("writes the finished question in the reader's language", () => {
    const state = builderState(
      { theme: "rain", verb: "trend", where: "murray-rain" },
      rules,
      catalog,
    );
    const english = text(builderSentence(state, en));
    expect(english).toMatch(/^Has rainfall changed in .+\?$/);
    expect(english).not.toContain("{");
    expect(text(builderSentence(state, es))).not.toBe(english);
  });

  it("asks about the reader's own place, by name once found", () => {
    const searching = builderState({ theme: "rain", verb: "trend", where: "mine" }, rules, catalog);
    expect(text(builderSentence(searching, en))).toBe("Has rainfall changed in your place?");
    const found = builderState(
      { theme: "rain", verb: "trend", where: "mine", lat: "12.9", lon: "-85.9", name: "Matagalpa" },
      rules,
      catalog,
    );
    expect(text(builderSentence(found, en))).toBe("Has rainfall changed in Matagalpa?");
  });

  it("fills one side of a comparison and keeps the other open", () => {
    const state = builderState(
      { theme: "temperature", verb: "comparison", a: "planet" },
      rules,
      catalog,
    );
    expect(text(builderSentence(state, en))).toBe(
      "Does air temperature change the same way across the planet and …?",
    );
  });

  it("names places, events and categories from the data", () => {
    expect(placeName("planet", en)).toBe("The planet");
    expect(placeIn("planet", en)).toBe("across the planet");
    expect(placeIn("svalbard-warming", en)).toMatch(/^in \S/);
    const anomaly = builderState({ theme: "weather", verb: "anomaly" }, rules, catalog).wheres[0];
    if (!anomaly) throw new Error("no anomaly options");
    expect(whereLabel(anomaly, en)).toMatch(/ · .*\d{4}$/);
    const category = builderState({ theme: "events" }, rules, catalog).wheres[0];
    if (!category || category.subject.type !== "catalog") throw new Error("no categories");
    expect(whereLabel(category, en)).toBe(en.translator.t(`cat.${category.subject.category}`));
    const pair = builderState({ theme: "soil_water", verb: "comparison" }, rules, catalog);
    expect(pair.spots).toHaveLength(2);
  });

  it("writes a catalog example with the category in lower case", () => {
    expect(
      exampleText(
        { theme: "events", type: "catalog", subject: { type: "catalog", category: "wildfires" } },
        en,
      ),
    ).toBe("Are there more or fewer wildfires than before?");
  });

  it("names variables, or falls back to their code", () => {
    expect(variableName("T2M", en)).toBe("Air temperature");
    expect(variableName("NOPE", en)).toBe("NOPE");
  });
});
