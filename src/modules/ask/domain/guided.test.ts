import { describe, expect, it } from "vitest";
import { getCaseCatalog, trendDirection, type TrendCase } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { getRules } from "./engine";
import {
  answerSentence,
  compareTarget,
  defaultDepth,
  firstLastMeans,
  guideHint,
  guideQuestion,
  hunchFeedback,
  hunchSheet,
  openGuided,
  placePhrase,
  questionTitle,
  readingSheet,
} from "./guided";

const catalog = getCaseCatalog();
const rules = getRules();
const en = { translator: getTranslator("en"), catalog };
const es = { translator: getTranslator("es"), catalog };

function opened(id: string) {
  const found = openGuided(rules, catalog, id);
  if (!found) throw new Error(`not guided: ${id}`);
  return found;
}

describe("defaultDepth", () => {
  it("takes the URL first, then the cookie, then simple", () => {
    expect(defaultDepth({ depth: "science" }, "guided")).toBe("science");
    expect(defaultDepth({}, "guided")).toBe("guided");
    expect(defaultDepth({}, undefined)).toBe("simple");
    expect(defaultDepth({}, "nonsense")).toBe("simple");
    expect(defaultDepth({ depth: "nonsense" }, "science")).toBe("science");
  });
});

describe("openGuided", () => {
  it("opens published and composed POWER questions with their case", () => {
    expect(opened("warmer").file.id).toBe("svalbard-warming");
    expect(opened("soil_water@chile-drying").file.id).toBe("chile-drying");
  });

  it("refuses MODIS cases, the planet and unknown ids", () => {
    expect(openGuided(rules, catalog, "greenness@amazon-browning")).toBeUndefined();
    expect(openGuided(rules, catalog, "temperature@planet")).toBeUndefined();
    expect(openGuided(rules, catalog, "nope")).toBeUndefined();
  });
});

describe("titles", () => {
  it("keeps the reviewed wording of a published question", () => {
    expect(questionTitle(opened("warmer").question, en)).toBe("Is it warmer here than before?");
  });

  it("writes a composed question from its segments", () => {
    expect(questionTitle(opened("soil_water@chile-drying").question, en)).toMatch(
      /^Has soil water changed in .+\?$/,
    );
    expect(placePhrase("planet", en)).toBe("across the planet");
  });
});

describe("guided hints", () => {
  it("averages the first and last k years, k capped at 10", () => {
    const series = Array.from({ length: 30 }, (_, index) => [2000 + index, index] as const);
    expect(firstLastMeans(series)).toEqual({ k: 10, first: 4.5, last: 24.5 });
    expect(firstLastMeans(series.slice(0, 6)).k).toBe(3);
  });

  it("has an answer on the hypothesis only", () => {
    const { file } = opened("warmer");
    expect(guideHint("guess", file, en.translator)).toMatch(/^The first 10 years average .+ °C\./);
    for (const screen of ["look", "check", "verdict", "done"] as const)
      expect(guideHint(screen, file, en.translator)).toBeUndefined();
  });

  it("asks each screen the question of the old step it replaces", () => {
    expect(guideQuestion("look", en.translator)).toBe(en.translator.t("ask.guide.3"));
    expect(guideQuestion("check", en.translator)).toBe(en.translator.t("ask.guide.6"));
    expect(guideQuestion("done", en.translator)).toBe(en.translator.t("ask.guide.8"));
  });
});

describe("quiz sheets", () => {
  const { file } = opened("warmer");
  const flat: TrendCase = { ...file, t: { ...file.t, significant: false, slope: -0.1 } };

  it("adds the figure when the hunch matches a confirmed trend", () => {
    const sheet = hunchSheet("up", file, "up", en);
    expect(sheet).toMatchObject({ kind: "match", title: "The test sees it too" });
    expect(sheet.text).toMatch(/per decade; .+ since 1981\.$/);
  });

  it("explains a hidden, a leaning or another reading", () => {
    expect(hunchSheet("unsure", file, "up", en)).toMatchObject({
      kind: "match",
      text: en.translator.t("ask.hunch.hidden"),
    });
    expect(hunchSheet("down", flat, "flat", en)).toMatchObject({
      kind: "match",
      title: en.translator.t("ask.sheet.lean"),
    });
    expect(hunchSheet("down", file, "up", en)).toMatchObject({
      kind: "other",
      text: en.translator.t("ask.hunch.other"),
    });
  });

  it("agrees on the check only when the reading matches the test", () => {
    expect(readingSheet("real", file, en.translator)).toMatchObject({
      kind: "match",
      title: "The test finds a clear direction",
    });
    expect(readingSheet("real", file, en.translator).text).toMatch(/^You thought the same\. /);
    expect(readingSheet("real", flat, en.translator).kind).toBe("other");
    expect(readingSheet("chance", flat, en.translator)).toMatchObject({
      kind: "match",
      title: en.translator.t("ask.chk.flat"),
    });
  });
});

describe("hunchFeedback", () => {
  const up = { significant: true, slope: 0.2 };
  const leansDown = { significant: false, slope: -0.1 };

  it("says nothing without a hunch", () => {
    expect(hunchFeedback(undefined, up, "up")).toBeUndefined();
  });

  it("compares a confirmed trend with its direction", () => {
    expect(hunchFeedback("up", up, "up")).toBe("match");
    expect(hunchFeedback("unsure", up, "up")).toBe("hidden");
    expect(hunchFeedback("down", up, "up")).toBe("other");
  });

  it("compares an unconfirmed trend with the way it leans", () => {
    expect(hunchFeedback("unsure", leansDown, "flat")).toBe("match");
    expect(hunchFeedback("down", leansDown, "flat")).toBe("lean");
    expect(hunchFeedback("up", leansDown, "flat")).toBe("other");
    expect(hunchFeedback("up", { significant: false, slope: 0 }, "flat")).toBe("other");
  });
});

describe("answerSentence", () => {
  it("states direction, amount without sign, place and years for a confirmed trend", () => {
    const { question, file } = opened("warmer");
    const { text, source } = answerSentence(question, file, trendDirection(file.t), en);
    expect(text).toMatch(
      /^Yes, it changed\. Air temperature rose \d+(\.\d+)? °C in .+ between 1981 and \d{4}\.$/,
    );
    expect(source).toContain("NASA POWER (MERRA-2)");
  });

  it("adds the relative note for relative variables", () => {
    const { question, file } = opened("soil_water@chile-drying");
    const confirmed: TrendCase = { ...file, t: { ...file.t, significant: true, slope: -0.01 } };
    const { text } = answerSentence(question, confirmed, "down", en);
    expect(text).toMatch(
      /^Yes, it changed\. Soil water fell \d+ % \(compared .+\) in Central Chile between/,
    );
    expect(text).toContain("(compared with its average over those years)");
  });

  it("does not claim a change for an unconfirmed trend", () => {
    const { question, file } = opened("warmer");
    const flat: TrendCase = { ...file, t: { ...file.t, significant: false } };
    expect(answerSentence(question, flat, "flat", es).text).toBe(
      es.translator.t("ask.ans.flat", {
        theme: es.translator.t("ask.theme.temperature"),
        place: placePhrase(file.id, es),
        from: file.series[0]?.[0],
        to: file.series.at(-1)?.[0],
      }),
    );
  });
});

describe("compareTarget", () => {
  it("prefers the published companion question", () => {
    const target = compareTarget(rules, catalog, opened("warmer").question);
    expect(target).toMatchObject({ kind: "question", question: { id: "rainfall" } });
  });

  it("offers the Rule 3 pair when there is no companion", () => {
    expect(compareTarget(rules, catalog, opened("soil_water@chile-drying").question)).toEqual({
      kind: "pair",
      theme: "soil_water",
      a: "chile-drying",
      b: "sahel-wetting",
    });
  });
});
