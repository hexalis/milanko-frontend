import { readString, toQueryString, type SearchParams } from "@/shared/lib/search-params";
import { askHref, parseDepth, type Depth } from "./ask-state";
import { compareHref } from "./compare";
import { isLiveVariable, parsePoint, placeHref, type PlacePoint } from "./place";
import { PLANET, QUESTION_TYPES, type Facts, type QuestionType, type Rules } from "./rules";

/*
 * The question builder: theme · verb · place (POC ask.js askBuilder L491–580, askWheres L472–489).
 * The interface never decides what can be asked: it asks the rules and draws the answer. Only ready
 * pairs appear, so every choice ends in a result.
 *
 * Every choice lives in the URL. The POC reset the later segments in the browser when an earlier one
 * changed (askBindBuilder L401–465); here the URL is validated in order (theme → verb → place) and
 * anything that no longer fits is dropped, so a stale or hand-written address still renders a
 * coherent builder. A free point ("mine", rule 4) is offered for a trend whose variables the API
 * serves at any coordinate; the place the reader finds is kept as lat, lon and name in the URL.
 * Comparing with a free point is not ported yet.
 */

/** What the finished question opens. */
type GoKind = "guided" | "case" | "compare" | "audit" | "place";

/** The id of the "my own place" option (POC "mine"). */
export const MINE = "mine";

/** The URL fields that hold the reader's own place once found. */
const POINT_FIELDS = ["lat", "lon", "name"] as const;

/** The case files the builder needs to know about (a CaseCatalog fits). */
export type BuilderCases = {
  trends: readonly { id: string; source: string }[];
  events: readonly { id: string; date: string }[];
};

/** What a place option stands for; the wording is resolved in the reader's language. */
export type Subject =
  | { type: "trend"; place: string }
  | { type: "comparison"; a: string; b: string }
  | { type: "anomaly"; event: string }
  | { type: "catalog"; category: string }
  /** The reader's own place, named once they have found it. */
  | { type: "point"; name: string | undefined };

export type WhereOption = { id: string; kind: GoKind; href: string; subject: Subject };

export type BuilderState = {
  depth: Depth;
  /** Ready themes, in fact-base order. */
  themes: string[];
  theme: string | undefined;
  /** Verbs the chosen theme can be asked with. */
  types: QuestionType[];
  type: QuestionType | undefined;
  /** Place options of a non-comparison verb. */
  wheres: WhereOption[];
  where: WhereOption | undefined;
  /** Places a comparison can pick from (the planet included). */
  spots: string[];
  a: string | undefined;
  b: string | undefined;
  /** A comparison with the same place on both sides cannot be opened. */
  isSameTwice: boolean;
  go: { href: string; kind: GoKind } | undefined;
  /** Main variables of the question; more than one earns a note. */
  variables: string[];
  /** The verb cannot be asked about the reader's own place (rule 4 does not hold). */
  hasNoFreePoint: boolean;
  /** The reader's own place, once found, while "mine" is the chosen place. */
  point: PlacePoint | undefined;
};

export type BuilderExample = {
  theme: string;
  type: QuestionType;
  where: string;
  subject: Subject;
  href: string;
  isActive: boolean;
};

const isQuestionType = (value: string | undefined): value is QuestionType =>
  QUESTION_TYPES.some((type) => type === value);

/**
 * Verbs the builder offers for a ready theme: its ready types, plus comparison when two reviewed
 * places can be compared. (The POC also compared one reviewed place with a free point; that side
 * is not ported, so rules.comparable would offer a comparison nobody could finish.)
 */
export function builderTypes(rules: Rules, theme: string): QuestionType[] {
  const row = rules.ready().find((candidate) => candidate.theme === theme);
  if (!row) return [];
  return QUESTION_TYPES.filter(
    (type) => row.types.includes(type) || (type === "comparison" && rules.pairs(theme).length > 0),
  );
}

/** "My own place", last in the list: its page opens once the reader has found the place. */
function mineOption(
  rules: Rules,
  theme: string,
  point: PlacePoint | undefined,
): WhereOption | undefined {
  if (!rules.allowsFreePoint(theme, "trend")) return undefined;
  const [variable] = rules.mains(theme, "trend");
  return {
    id: MINE,
    kind: "place",
    href: point ? placeHref(point, isLiveVariable(variable) ? variable : undefined) : "",
    subject: { type: "point", name: point?.name },
  };
}

/** Where a verb can be asked, and the page that answers it (POC askWheres). */
export function whereOptions(
  rules: Rules,
  cases: BuilderCases,
  {
    theme,
    type,
    depth,
    point,
  }: { theme: string; type: QuestionType; depth: Depth; point?: PlacePoint },
): WhereOption[] {
  switch (type) {
    case "trend": {
      const mine = mineOption(rules, theme, point);
      const reviewed = rules
        .places(theme, "trend")
        .filter((place) => place !== PLANET)
        .flatMap((place): WhereOption[] => {
          const trend = cases.trends.find((candidate) => candidate.id === place);
          if (!trend) return [];
          const subject: Subject = { type: "trend", place };
          // The guided flow reads one NASA POWER series; other sources open their case file.
          if (trend.source !== "power") {
            return [{ id: place, kind: "case", href: `/cases/${place}`, subject }];
          }
          const { id } = rules.question(theme, "trend", place);
          const href = askHref(id, { screen: "look", depth });
          return [{ id: place, kind: "guided", href, subject }];
        });
      return mine ? [...reviewed, mine] : reviewed;
    }
    case "comparison":
      return rules.pairs(theme).map(([a, b]) => ({
        id: `${a}~${b}`,
        kind: "compare",
        href: compareHref({ theme, a, b, depth }),
        subject: { type: "comparison", a, b },
      }));
    case "anomaly":
      return rules
        .places(theme, "anomaly")
        .flatMap((place) => cases.events.filter((event) => event.id === place))
        .toSorted((first, second) => second.date.localeCompare(first.date))
        .map((event) => ({
          id: event.id,
          kind: "case",
          href: `/cases/${event.id}`,
          subject: { type: "anomaly", event: event.id },
        }));
    case "catalog":
      // The POC opened the catalog-audit tab (#/cases?kind=audit&cat=…). That tab is not ported yet,
      // so the anomaly files stand in for it.
      return rules.places(theme, "catalog").map((category) => ({
        id: category,
        kind: "audit",
        href: "/cases?kind=event",
        subject: { type: "catalog", category },
      }));
  }
}

/** Picks one option by id; a single option needs no choice. */
function pickWhere(options: readonly WhereOption[], id: string | undefined) {
  return (
    options.find((option) => option.id === id) ?? (options.length === 1 ? options[0] : undefined)
  );
}

type ComparisonPick = Pick<BuilderState, "spots" | "a" | "b" | "isSameTwice" | "go">;

function comparisonPick(
  rules: Rules,
  params: SearchParams,
  theme: string,
  depth: Depth,
): ComparisonPick {
  const spots = rules.places(theme, "trend");
  // An example arrives as where=a~b; the two selectors say it from then on.
  const [fromWhereA, fromWhereB] = (readString(params, "where") ?? "").split("~");
  const pick = (value: string | undefined) => spots.find((spot) => spot === value);
  const a = pick(readString(params, "a") ?? fromWhereA);
  const b = pick(readString(params, "b") ?? fromWhereB);
  const isSameTwice = Boolean(a && b && a === b);
  const go =
    a && b && !isSameTwice
      ? { href: compareHref({ theme, a, b, depth }), kind: "compare" as const }
      : undefined;
  return { spots, a, b, isSameTwice, go };
}

const NO_COMPARISON: ComparisonPick = {
  spots: [],
  a: undefined,
  b: undefined,
  isSameTwice: false,
  go: undefined,
};

/** The builder as the URL describes it, with every invalid piece dropped in segment order. */
export function builderState(
  params: SearchParams,
  rules: Rules,
  cases: BuilderCases,
): BuilderState {
  const depth = parseDepth(params);
  const themes = rules.ready().map((row) => row.theme);
  const requestedTheme = readString(params, "theme");
  const theme = themes.find((candidate) => candidate === requestedTheme);
  const types = theme ? builderTypes(rules, theme) : [];
  const requestedType = readString(params, "verb");
  const type =
    isQuestionType(requestedType) && types.includes(requestedType)
      ? requestedType
      : types.length === 1
        ? types[0]
        : undefined;

  const base = { depth, themes, theme, types, type };
  if (!theme || !type) {
    return {
      ...base,
      ...NO_COMPARISON,
      wheres: [],
      where: undefined,
      variables: [],
      hasNoFreePoint: false,
      point: undefined,
    };
  }

  const variables = rules.mains(theme, type);
  if (type === "comparison") {
    return {
      ...base,
      ...comparisonPick(rules, params, theme, depth),
      wheres: [],
      where: undefined,
      variables,
      // Comparing with the reader's own place is not ported yet.
      hasNoFreePoint: true,
      point: undefined,
    };
  }

  // The found place only counts while "mine" is the chosen place.
  const isMine = readString(params, "where") === MINE;
  const point = isMine ? parsePoint(params) : undefined;
  const wheres = whereOptions(rules, cases, { theme, type, depth, point });
  const where = pickWhere(wheres, readString(params, "where"));
  return {
    ...base,
    ...NO_COMPARISON,
    wheres,
    where,
    // "Mine" opens nothing until the reader has found the place.
    go: where?.href ? { href: where.href, kind: where.kind } : undefined,
    variables,
    hasNoFreePoint: type !== "catalog" && !rules.allowsFreePoint(theme, type),
    point: where?.id === MINE ? point : undefined,
  };
}

/** Link that fills the builder at `path` with a whole question. */
function builderHref(
  path: string,
  pick: { theme: string; verb: QuestionType; where: string; depth: Depth },
): string {
  return `${path}${toQueryString(pick)}`;
}

/**
 * Example questions (facts.examples) that fill the three pieces, each shown only while the rules can
 * still answer it. A comparison example is active when both of its places are the ones chosen.
 */
export function builderExamples(
  examples: Facts["examples"],
  {
    state,
    rules,
    cases,
    path,
  }: { state: BuilderState; rules: Rules; cases: BuilderCases; path: string },
): BuilderExample[] {
  const ready = rules.ready();
  return examples.flatMap((example): BuilderExample[] => {
    const isReady = ready.some(
      (row) => row.theme === example.theme && row.types.includes(example.type),
    );
    if (!isReady) return [];
    const option = whereOptions(rules, cases, {
      theme: example.theme,
      type: example.type,
      depth: state.depth,
    }).find((candidate) => candidate.id === example.where);
    if (!option) return [];
    const isChosen =
      example.type === "comparison"
        ? `${state.a}~${state.b}` === example.where
        : state.where?.id === example.where;
    return [
      {
        theme: example.theme,
        type: example.type,
        where: example.where,
        subject: option.subject,
        href: builderHref(path, {
          theme: example.theme,
          verb: example.type,
          where: example.where,
          depth: state.depth,
        }),
        isActive: state.theme === example.theme && state.type === example.type && isChosen,
      },
    ];
  });
}

export type BuilderSegment = "theme" | "verb" | "where" | "a" | "b";

type PointField = (typeof POINT_FIELDS)[number];

/**
 * Fields that become stale when a segment changes (POC askBindBuilder resets). A new place drops
 * the reader's own place too: choosing "mine" again starts a new search.
 */
export function staleSegments(changed: BuilderSegment): readonly (BuilderSegment | PointField)[] {
  if (changed === "theme") return ["verb", "where", "a", "b", ...POINT_FIELDS];
  if (changed === "verb") return ["where", "a", "b", ...POINT_FIELDS];
  if (changed === "where") return POINT_FIELDS;
  return [];
}
