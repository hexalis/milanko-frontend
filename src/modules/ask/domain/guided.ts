import {
  changeLabel,
  fileName,
  formatFigure,
  unitLabel,
  type CaseCatalog,
  type Direction,
  type Point,
  type TrendCase,
} from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import {
  DEPTHS,
  parseDepth,
  resolveQuestion,
  type Depth,
  type GuidedCase,
  type Hunch,
} from "./ask-state";
import { PLANET, type Question, type Rules } from "./rules";

/*
 * Wording and decisions of the guided investigation (POC ask.js renderAsk). Every figure comes from
 * the reviewed case and its computed trend; nothing here is a score of the reader.
 */

type TextContext = { translator: Translator; catalog: CaseCatalog };

/** Everything a guided step reads: the question, its case, and where the reader stands. */
export type GuidedView = {
  question: Question;
  file: TrendCase;
  direction: Direction;
  step: number;
  depth: Depth;
  hunch?: Hunch;
};

/** The source line every guided chart and answer quotes. */
export const GUIDED_SOURCE = "NASA POWER · MERRA-2 · 0.5° × 0.625°";
const ANSWER_SOURCE = "NASA POWER (MERRA-2)";
export const GRID_CELL = "0.5° × 0.625°";

/**
 * The unit as written in chart subtitles and table heads (POC unitText): unlike the case files'
 * unitLabel, the 0–1 soil index keeps its range so the reader sees the scale.
 */
export function unitText(unit: string, locale: Translator["locale"]): string {
  return locale === "es" ? unit.replace("/day", "/día") : unit;
}

/** Depth from the URL; without one, the reader's last choice (cookie); else plain words. */
export function defaultDepth(params: SearchParams, cookieValue: string | undefined): Depth {
  const remembered = DEPTHS.find((depth) => depth === cookieValue) ?? "simple";
  return parseDepth(params, remembered);
}

export function findTrend(catalog: CaseCatalog, id: string): TrendCase | undefined {
  return catalog.trends.find((file) => file.id === id);
}

/** A guided question with the trend case it reads. */
export function openGuided(
  rules: Rules,
  catalog: CaseCatalog,
  id: string,
): { question: Question; file: TrendCase } | undefined {
  const findCase = (caseId: string): GuidedCase | undefined => findTrend(catalog, caseId);
  const question = resolveQuestion(rules, id, findCase);
  const file = question ? findTrend(catalog, question.case) : undefined;
  return question && file ? { question, file } : undefined;
}

/** A place as each language says it inside a question: "in Svalbard", "across the planet". */
export function placePhrase(place: string, { translator, catalog }: TextContext): string {
  if (place === PLANET) return translator.t("ask.in.planet");
  const file = findTrend(catalog, place);
  const name = file ? fileName(file, { translator, catalog }) : place;
  return translator.t("ask.in", { place: name });
}

/** A published question keeps its reviewed wording; a composed one is written from its segments. */
export function questionTitle(question: Question, context: TextContext): string {
  const { t } = context.translator;
  if (question.published) return t(`ask.q.${question.id}`);
  return t("ask.pat.trend", {
    theme: t(`ask.theme.${question.topic}`),
    place: placePhrase(question.case, context),
  });
}

export function compareTitle(theme: string, a: string, b: string, context: TextContext): string {
  return context.translator.t("ask.pat.comparison", {
    theme: context.translator.t(`ask.theme.${theme}`),
    a: placePhrase(a, context),
    b: placePhrase(b, context),
  });
}

/* ---------- Guided-depth hints (steps 4 and 6) ---------- */

const MAX_HINT_YEARS = 10;

/** Mean of the first and of the last k years, k = min(10, half the record). */
export function firstLastMeans(series: readonly Point[]): {
  k: number;
  first: number;
  last: number;
} {
  const k = Math.min(MAX_HINT_YEARS, Math.floor(series.length / 2));
  const mean = (rows: readonly Point[]) =>
    rows.length ? rows.reduce((sum, [, value]) => sum + value, 0) / rows.length : Number.NaN;
  return { k, first: mean(series.slice(0, k)), last: mean(series.slice(-k)) };
}

/** True when the 95 % range of the slope stays on one side of zero. */
export function isRangeClear(t: { slopeLow: number; slopeHigh: number }): boolean {
  return t.slopeLow > 0 || t.slopeHigh < 0;
}

/** The answer behind the hint of the guided depth: only steps 4 and 6 have one the data can give. */
export function guideHint(
  step: number,
  file: TrendCase,
  translator: Translator,
): string | undefined {
  if (step === 4) {
    const { k, first, last } = firstLastMeans(file.series);
    const unit = unitLabel(file.unit, translator.locale);
    const value = (x: number) => `${formatFigure(x, file.digits + 1)} ${unit}`.trim();
    return translator.t("ask.guide.4.a", { k, first: value(first), last: value(last) });
  }
  if (step === 6)
    return translator.t(isRangeClear(file.t) ? "ask.guide.6.clear" : "ask.guide.6.cross");
  return undefined;
}

/* ---------- Step 7: the verdict ---------- */

export type HunchFeedback = "match" | "hidden" | "other" | "lean";

/**
 * The reader's hunch against the result, never as a score (POC L270–273): what the eye saw, and
 * what the test adds. A confirmed trend is compared with its direction; an unconfirmed one with
 * the way the line merely leans.
 */
export function hunchFeedback(
  hunch: Hunch | undefined,
  t: { significant: boolean; slope: number },
  direction: Direction,
): HunchFeedback | undefined {
  if (!hunch) return undefined;
  if (t.significant) {
    if (hunch === direction) return "match";
    return hunch === "unsure" ? "hidden" : "other";
  }
  const lean: Hunch = t.slope > 0 ? "up" : t.slope < 0 ? "down" : "unsure";
  if (hunch === "unsure") return "match";
  return hunch === lean ? "lean" : "other";
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * One sentence a person can repeat or copy, plus its source line. Every piece comes from the
 * result: direction, amount, place, years.
 */
export function answerSentence(
  question: Question,
  file: TrendCase,
  direction: Direction,
  context: TextContext,
): { text: string; source: string } {
  const { t } = context.translator;
  const from = file.series[0]?.[0] ?? 0;
  const to = file.series.at(-1)?.[0] ?? 0;
  const theme = t(`ask.theme.${question.topic}`);
  const place = placePhrase(question.case, context);
  const source = t("ask.ans.src", { source: ANSWER_SOURCE });
  if (!file.t.significant || direction === "flat") {
    return { text: t("ask.ans.flat", { theme, place, from, to }), source };
  }
  const magnitude = changeLabel(file, context).replace(/^[+−-]/, "");
  const amount = file.relative ? `${magnitude} ${t("ask.ans.rel")}` : magnitude;
  return {
    text: t(`ask.ans.${direction}`, { theme: capitalize(theme), amount, place, from, to }),
    source,
  };
}

export type CompareTarget =
  | { kind: "question"; question: Question }
  | { kind: "pair"; theme: string; a: string; b: string };

/**
 * Where the verdict sends the reader next: the published companion question, or (Rule 3) the same
 * analysis reviewed in a second place, offered as a comparison.
 */
export function compareTarget(
  rules: Rules,
  catalog: CaseCatalog,
  question: Question,
): CompareTarget | undefined {
  const other = rules.questions().find((candidate) => candidate.id === question.compare);
  if (other) {
    return openGuided(rules, catalog, other.id) ? { kind: "question", question: other } : undefined;
  }
  const pair = rules.pairs(question.topic).find((places) => places.includes(question.case));
  return pair ? { kind: "pair", theme: question.topic, a: pair[0], b: pair[1] } : undefined;
}
