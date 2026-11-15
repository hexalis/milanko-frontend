import { trendDirection, type CaseCatalog, type Direction, type TrendCase } from "@/modules/cases";
import { readString, toQueryString, type SearchParams } from "@/shared/lib/search-params";
import { askHref, type Depth } from "./ask-state";
import { findTrend, openGuided } from "./guided";
import { PLANET, type Rules } from "./rules";

/*
 * Comparison: the same variable in two places (POC ask.js renderAskCompare). Nothing new is
 * computed: two reviewed analyses are read side by side, each with its own test. Free points are
 * not served yet, so both sides are reviewed places or the planet-wide sample.
 */

const SIGNIFICANCE = 0.05;

export type CompareQuery = { theme: string; a: string; b: string };

/** Two different places where the theme's trend is reviewed, or nothing. */
export function parseCompare(rules: Rules, params: SearchParams): CompareQuery | undefined {
  const theme = readString(params, "theme");
  const a = readString(params, "a");
  const b = readString(params, "b");
  if (!theme || !a || !b || a === b) return undefined;
  const places = rules.places(theme, "trend");
  return places.includes(a) && places.includes(b) ? { theme, a, b } : undefined;
}

export function compareHref({ theme, a, b, depth }: CompareQuery & { depth: Depth }): string {
  return `/ask/compare${toQueryString({ theme, a, b, depth })}`;
}

type SideReading = {
  id: string;
  isSignificant: boolean;
  direction: Direction;
  p: number;
  from: number;
  to: number;
  n: number;
};

export type CompareSide =
  | (SideReading & {
      kind: "planet";
      perDecade: number;
      total: number;
      points: number;
    })
  | (SideReading & { kind: "case"; file: TrendCase });

/** Each side in the same shape: the planet-wide sample, or a reviewed trend case. */
export function compareSide(id: string, catalog: CaseCatalog): CompareSide | undefined {
  if (id === PLANET) {
    const { global } = catalog;
    const isSignificant = global.p < SIGNIFICANCE;
    const direction: Direction = !isSignificant ? "flat" : global.perDecade > 0 ? "up" : "down";
    return {
      kind: "planet",
      id,
      isSignificant,
      direction,
      p: global.p,
      from: global.from,
      to: global.to,
      n: global.years,
      perDecade: global.perDecade,
      total: global.total,
      points: global.points,
    };
  }
  const file = findTrend(catalog, id);
  if (!file) return undefined;
  return {
    kind: "case",
    id,
    file,
    isSignificant: file.t.significant,
    direction: trendDirection(file.t),
    p: file.t.p,
    from: file.series[0]?.[0] ?? 0,
    to: file.series.at(-1)?.[0] ?? 0,
    n: file.t.n,
  };
}

export type CompareJoin = "same" | "opposite" | "pending";

/** The sentence that joins them only says whether both pass the test and which way each one goes. */
export function compareJoin(
  a: Pick<CompareSide, "isSignificant" | "direction">,
  b: Pick<CompareSide, "isSignificant" | "direction">,
): CompareJoin {
  if (!(a.isSignificant && b.isSignificant)) return "pending";
  return a.direction === b.direction ? "same" : "opposite";
}

/** Where a side's card leads: its guided investigation, its case file, or the method page. */
export function sideHref(
  rules: Rules,
  catalog: CaseCatalog,
  theme: string,
  side: CompareSide,
  depth: Depth,
): string {
  if (side.kind === "planet") return "/method";
  const question = rules.question(theme, "trend", side.id);
  return openGuided(rules, catalog, question.id)
    ? askHref(question.id, { screen: "look", depth })
    : `/cases/${side.id}`;
}
