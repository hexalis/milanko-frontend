import { readOption, toQueryString, type SearchParams } from "@/shared/lib/search-params";
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

/** Step 1 (the question) lives at /ask; the guided flow is steps 2–8. */
export const FIRST_GUIDED_STEP = 2;
export const LAST_STEP = 8;

export function parseDepth(params: SearchParams, fallback: Depth = "simple"): Depth {
  return readOption(params, "depth", DEPTHS, fallback);
}

export function parseStep(params: SearchParams): number {
  const raw = Number(params.step);
  if (!Number.isInteger(raw)) return FIRST_GUIDED_STEP;
  return Math.min(LAST_STEP, Math.max(FIRST_GUIDED_STEP, raw));
}

export function parseHunch(params: SearchParams): Hunch | undefined {
  const value = typeof params.h === "string" ? params.h : undefined;
  return HUNCHES.find((hunch) => hunch === value);
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

type GuidedState = { step: number; depth: Depth; hunch?: Hunch };

/** Link to a step of the guided flow, carrying the depth and the reader's hunch. */
export function askHref(id: string, { step, depth, hunch }: GuidedState): string {
  return `/ask/${encodeURIComponent(id)}${toQueryString({ step, depth, h: hunch })}`;
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
