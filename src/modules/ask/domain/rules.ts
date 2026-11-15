/*
 * Milanko: the rules engine behind "I have a question" (POC rules.js, ported 1:1).
 * A question is built from segments: a theme (what), a type of investigation (verb) and a place.
 * The team declares facts (data/facts.json); six rules deduce what can be offered. Nobody writes the
 * list of available questions: review a new place and the questions that needed it appear on their own.
 * No figure lives here or in facts.json: every number comes from the data files.
 */

export const QUESTION_TYPES = ["trend", "comparison", "anomaly", "catalog"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
type AnalysisType = Exclude<QuestionType, "comparison">;

export type Status = "ready" | "draft" | "candidate";

type Use = {
  theme: string;
  type: AnalysisType;
  variable: string;
  role: string;
  /** What a confirmed direction means for the question (e.g. up → "more_water"). */
  reading?: Partial<Record<"up" | "down" | "flat", string>>;
};

export type Facts = {
  themes: { id: string; family: string }[];
  uses: Use[];
  live: Partial<Record<AnalysisType, string[]>>;
  cautions: { id: string; variables: string[]; box: { lat: number[]; lon: number[] } }[];
  examples: { theme: string; type: QuestionType; where: string }[];
  published: { id: string; theme: string; type: QuestionType; place: string; compare?: string }[];
};

/** One reviewed analysis: one variable, one kind of analysis, one place. */
export type Reviewed = { variable: string; type: AnalysisType; place: string };

export type Question = {
  /** Published id ("warmer") or composed from its segments ("soil_water@chile-drying"). */
  id: string;
  published: boolean;
  compare?: string;
  /** Theme family, for icons and tones. */
  theme: string;
  /** The fact theme ("soil_water"). */
  topic: string;
  type: QuestionType;
  /** The reviewed place: a case file id. */
  case: string;
  places: string[];
  variable: string | undefined;
  variables: string[];
  freePoint: boolean;
};

export type AnalysisVerdict = "confirmed" | "inconclusive" | "not_evaluable";
export type Synthesis = "supported" | "partial" | "inconclusive" | "opposed" | "not_evaluable";

export const PLANET = "planet";

export function createRules(facts: Facts, reviewed: readonly Reviewed[]) {
  const live = (type: AnalysisType) => facts.live[type] ?? [];
  const reviewedKeys = new Set(reviewed.map((r) => `${r.variable}|${r.type}|${r.place}`));
  const isReviewed = (variable: string, type: AnalysisType, place: string) =>
    reviewedKeys.has(`${variable}|${type}|${place}`);
  const placesOf = (variable: string, type: AnalysisType) =>
    reviewed.filter((r) => r.variable === variable && r.type === type).map((r) => r.place);

  // A comparison reads two trend analyses side by side, so it uses what the theme's trend uses.
  const kind = (type: QuestionType): AnalysisType => (type === "comparison" ? "trend" : type);
  const used = (theme: string, type: QuestionType) =>
    facts.uses.filter((use) => use.theme === theme && use.type === kind(type));
  const mains = (theme: string, type: QuestionType) =>
    used(theme, type)
      .filter((use) => use.role === "main")
      .map((use) => use.variable);

  // Rule 1 · A theme-and-verb pair exists if someone declared which main variable it uses.
  const exists = (theme: string, type: QuestionType) => mains(theme, type).length > 0;

  // Rule 2 · A question can be offered in a place if ALL its main variables are reviewed there.
  const offerable = (theme: string, type: QuestionType, place: string) =>
    exists(theme, type) &&
    mains(theme, type).every((variable) => isReviewed(variable, kind(type), place));

  const places = (theme: string, type: QuestionType): string[] => {
    const [first] = mains(theme, type);
    if (!first) return [];
    return [...new Set(placesOf(first, kind(type)))].filter((place) =>
      offerable(theme, type, place),
    );
  };

  // Rule 3 · Two places can be compared if both have the same analyses reviewed.
  const pairs = (theme: string): [string, string][] => {
    const list = places(theme, "trend");
    return list.flatMap((a, index) => list.slice(index + 1).map((b): [string, string] => [a, b]));
  };

  // Rule 4 · Any point can be investigated if every main variable can be computed live.
  const allowsFreePoint = (theme: string, type: QuestionType) =>
    type !== "comparison" &&
    exists(theme, type) &&
    mains(theme, type).every((variable) => live(kind(type)).includes(variable));

  // Rules 3 and 4 together: with a free point, one reviewed place is enough to compare with.
  const comparable = (theme: string) =>
    pairs(theme).length > 0 ||
    (places(theme, "trend").length > 0 && allowsFreePoint(theme, "trend"));

  // Rule 5 · The status of each pair is deduced, never labelled by hand.
  const status = (theme: string, type: QuestionType): Status | null => {
    if (!exists(theme, type)) return null;
    if (type === "comparison") {
      if (pairs(theme).length) return "ready";
      return status(theme, "trend") === "candidate" ? "candidate" : "draft";
    }
    if (places(theme, type).length) return "ready";
    const isPartlyReviewed = mains(theme, type).some(
      (variable) => placesOf(variable, kind(type)).length,
    );
    if (isPartlyReviewed || allowsFreePoint(theme, type)) return "draft";
    return "candidate";
  };

  // Rule 6 · Each main variable keeps its own series and test; this only picks the sentence that
  // says which ones support the answer. There is never a combined figure.
  const synthesis = (
    analyses: readonly { verdict: AnalysisVerdict; reading?: string }[],
  ): Synthesis => {
    const usable = analyses.filter((analysis) => analysis.verdict !== "not_evaluable");
    if (!usable.length) return "not_evaluable";
    const confirmed = usable.filter((analysis) => analysis.verdict === "confirmed");
    if (!confirmed.length) return "inconclusive";
    if (new Set(confirmed.map((analysis) => analysis.reading)).size > 1) return "opposed";
    return confirmed.length === usable.length ? "supported" : "partial";
  };

  const reading = (
    theme: string,
    type: QuestionType,
    variable: string,
    direction: "up" | "down" | "flat",
  ) =>
    used(theme, type).find((use) => use.variable === variable)?.reading?.[direction] ?? direction;

  // Every pair that exists, with its deduced status: the table design and the team check against.
  const matrix = () =>
    facts.themes.map((theme) => ({
      theme: theme.id,
      cells: Object.fromEntries(
        QUESTION_TYPES.map((type) => [type, status(theme.id, type)]),
      ) as Record<QuestionType, Status | null>,
    }));

  function question(theme: string, type: QuestionType, place: string): Question {
    const family = facts.themes.find((candidate) => candidate.id === theme)?.family ?? theme;
    const variables = mains(theme, type);
    const published = facts.published.find(
      (candidate) =>
        candidate.theme === theme && candidate.type === type && candidate.place === place,
    );
    return {
      id: published ? published.id : `${theme}@${place}`,
      published: Boolean(published),
      compare: published?.compare,
      theme: family,
      topic: theme,
      type,
      case: place,
      places: places(theme, type).filter((candidate) => candidate !== PLANET),
      variable: variables[0],
      variables,
      freePoint: allowsFreePoint(theme, type),
    };
  }

  // Published questions whose rule 2 holds somewhere.
  const questions = (): Question[] =>
    facts.published.flatMap((published) => {
      const where = places(published.theme, published.type).filter((place) => place !== PLANET);
      const [first] = where;
      if (!first) return [];
      const place = where.includes(published.place) ? published.place : first;
      return [
        {
          ...question(published.theme, published.type, place),
          id: published.id,
          published: true,
          compare: published.compare,
        },
      ];
    });

  // Quality flags the team documented for a region: a live result there must not be read as a conclusion.
  const cautions = (lat: number, lon: number) =>
    facts.cautions.filter(
      (caution) =>
        lat >= (caution.box.lat[0] ?? Infinity) &&
        lat <= (caution.box.lat[1] ?? -Infinity) &&
        lon >= (caution.box.lon[0] ?? Infinity) &&
        lon <= (caution.box.lon[1] ?? -Infinity),
    );

  // The segments the builder can offer: only ready pairs, so every choice ends in a result.
  const ready = () =>
    matrix()
      .map((row) => ({
        theme: row.theme,
        types: QUESTION_TYPES.filter((type) => row.cells[type] === "ready"),
      }))
      .filter((row) => row.types.length);

  return {
    exists,
    mains,
    offerable,
    places,
    pairs,
    allowsFreePoint,
    status,
    synthesis,
    reading,
    matrix,
    questions,
    question,
    ready,
    cautions,
    comparable,
  };
}

export type Rules = ReturnType<typeof createRules>;
