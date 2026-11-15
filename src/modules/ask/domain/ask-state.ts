import {
  readOption,
  readString,
  toQueryString,
  type SearchParams,
} from "@/shared/lib/search-params";
import type { Question, Rules } from "./rules";

/*
 * URL state of "I have a question" (POC ask.js): every view state lives in the URL so any step can be
 * shared. The reading depth is also remembered in a cookie (the POC used localStorage "etd-depth").
 */

export const DEPTHS = ["simple", "guided", "science"] as const;
export type Depth = (typeof DEPTHS)[number];
export const DEPTH_COOKIE = "etd-depth";

export const HUNCHES = ["up", "down", "unsure"] as const;
export type Hunch = (typeof HUNCHES)[number];

/*
 * The investigation runs as a short lesson: four screens and a close, after the question (step 1,
 * at /ask). Old links numbered eight steps; each lands on the screen that now holds what it showed.
 */
export const ASK_FLOW = ["look", "guess", "check", "verdict", "done"] as const;
export type Screen = (typeof ASK_FLOW)[number];
const ASK_LEGACY: Readonly<Record<string, Screen>> = {
  "2": "look",
  "3": "look",
  "4": "guess",
  "5": "guess",
  "6": "check",
  "7": "verdict",
  "8": "done",
};
/** The question pick counts as the first step. */
export const ASK_STEPS = ASK_FLOW.length + 1;

/** The reader's answer on the check screen: a real change, or the usual up and down. */
const READINGS = ["real", "chance"] as const;
export type Reading = (typeof READINGS)[number];

export function parseDepth(params: SearchParams, fallback: Depth = "simple"): Depth {
  return readOption(params, "depth", DEPTHS, fallback);
}

const isScreen = (value: string | undefined): value is Screen =>
  ASK_FLOW.some((screen) => screen === value);

/** The screen an old `?step=N` link meant, when the URL has no valid `s`. */
export function legacyScreen(params: SearchParams): Screen | undefined {
  if (isScreen(readString(params, "s"))) return undefined;
  const step = readString(params, "step");
  // Own keys only: "?step=constructor" must not reach Object.prototype.
  return step !== undefined && Object.hasOwn(ASK_LEGACY, step) ? ASK_LEGACY[step] : undefined;
}

/** The screen in the URL (`s`), else the one an old step number maps to, else the first. */
export function parseScreen(params: SearchParams): Screen {
  const screen = readString(params, "s");
  if (isScreen(screen)) return screen;
  return legacyScreen(params) ?? "look";
}

export function parseHunch(params: SearchParams): Hunch | undefined {
  const value = readString(params, "h");
  return HUNCHES.find((hunch) => hunch === value);
}

export function parseReading(params: SearchParams): Reading | undefined {
  const value = readString(params, "r");
  return READINGS.find((reading) => reading === value);
}

/** The screens on either side of this one; the first screen goes back to the question. */
export function screenNeighbours(screen: Screen): {
  index: number;
  prev?: Screen;
  next?: Screen;
} {
  const index = ASK_FLOW.indexOf(screen);
  return { index, prev: ASK_FLOW[index - 1], next: ASK_FLOW[index + 1] };
}

/**
 * The URL's depth wins; without one, the depth the reader chose before (cookie) fills it in, so
 * every link the builder writes carries the remembered depth.
 */
export function withRememberedDepth(
  params: SearchParams,
  cookieValue: string | undefined,
): SearchParams {
  if (params.depth !== undefined) return params;
  const remembered = DEPTHS.find((depth) => depth === cookieValue);
  return remembered ? { ...params, depth: remembered } : params;
}

export type GuidedState = { screen: Screen; depth: Depth; hunch?: Hunch; reading?: Reading };

/** The question's own page, without any state (the quizzes' GET forms submit here). */
export function askPath(id: string): string {
  return `/ask/${encodeURIComponent(id)}`;
}

/** Link to a screen of the guided flow, carrying the depth and the reader's answers. */
export function askHref(id: string, { screen, depth, hunch, reading }: GuidedState): string {
  return `${askPath(id)}${toQueryString({ s: screen, depth, h: hunch, r: reading })}`;
}

/** A guided investigation needs a NASA POWER trend (MODIS cases open their case file instead). */
export type GuidedCase = { id: string; source: string };

/**
 * A published id ("warmer") or a composed "topic@place" id, only for trend questions that the rules
 * can offer in that place and whose case has a POWER series. Anything else is not found.
 */
export function resolveQuestion(
  rules: Rules,
  id: string,
  findCase: (caseId: string) => GuidedCase | undefined,
): Question | undefined {
  const isGuided = (question: Question) => findCase(question.case)?.source === "power";
  const published = rules.questions().find((question) => question.id === id);
  if (published) return isGuided(published) ? published : undefined;

  const [topic, place, ...rest] = id.split("@");
  if (!topic || !place || rest.length) return undefined;
  if (!rules.offerable(topic, "trend", place)) return undefined;
  const question = rules.question(topic, "trend", place);
  return isGuided(question) ? question : undefined;
}

/** Every id the guided flow can open, for static generation. */
export function guidedQuestionIds(
  rules: Rules,
  findCase: (caseId: string) => GuidedCase | undefined,
): string[] {
  const ids = new Set(rules.questions().map((question) => question.id));
  for (const { theme, types } of rules.ready()) {
    if (!types.includes("trend")) continue;
    for (const place of rules.places(theme, "trend")) {
      ids.add(rules.question(theme, "trend", place).id);
    }
  }
  return [...ids].filter((id) => resolveQuestion(rules, id, findCase));
}
