/** One persisted variable, as returned by GET /data/coverage. */
export type VariableCoverage = {
  variable: string;
  source: string;
  name: string;
  unit?: string | null;
  count: number;
  start?: string | null;
  end?: string | null;
};

export type CoverageFilters = {
  source?: string;
  query?: string;
  isSortedByCount: boolean;
};

export type CoverageSummary = {
  variableCount: number;
  observationCount: number;
  sources: { source: string; variableCount: number }[];
  firstDate?: string;
  lastDate?: string;
};

function byCatalogOrder(a: VariableCoverage, b: VariableCoverage): number {
  return a.source.localeCompare(b.source) || a.variable.localeCompare(b.variable);
}

export function listSources(rows: readonly VariableCoverage[]): string[] {
  return [...new Set(rows.map((row) => row.source))].sort((a, b) => a.localeCompare(b));
}

export function filterCoverage(
  rows: readonly VariableCoverage[],
  { source, query, isSortedByCount }: CoverageFilters,
): VariableCoverage[] {
  const needle = query?.toLowerCase();
  const matches = rows.filter((row) => {
    if (source && row.source !== source) return false;
    if (!needle) return true;
    return [row.variable, row.name, row.unit, row.source].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(needle),
    );
  });
  return matches.toSorted((a, b) =>
    isSortedByCount && a.count !== b.count ? b.count - a.count : byCatalogOrder(a, b),
  );
}

export function summarizeCoverage(rows: readonly VariableCoverage[]): CoverageSummary {
  const starts = rows.flatMap((row) => (row.start ? [row.start] : [])).toSorted();
  const ends = rows.flatMap((row) => (row.end ? [row.end] : [])).toSorted();
  return {
    variableCount: rows.length,
    observationCount: rows.reduce((total, row) => total + row.count, 0),
    sources: listSources(rows).map((source) => ({
      source,
      variableCount: rows.filter((row) => row.source === source).length,
    })),
    firstDate: starts[0],
    lastDate: ends.at(-1),
  };
}

/** One entry per variable (the first source listed wins), in catalog order. */
export function listVariableOptions(rows: readonly VariableCoverage[]): VariableCoverage[] {
  const seen = new Map<string, VariableCoverage>();
  for (const row of rows) {
    if (!seen.has(row.variable)) seen.set(row.variable, row);
  }
  return [...seen.values()].toSorted(byCatalogOrder);
}

const PREFERRED_VARIABLE = "T2M";
const PREFERRED_SOURCE = "NASA POWER";

/** The requested variable when it exists; otherwise T2M, then any NASA POWER variable. */
export function pickVariable(
  options: readonly VariableCoverage[],
  requested: string | undefined,
): VariableCoverage | undefined {
  return (
    options.find((row) => row.variable === requested) ??
    options.find((row) => row.variable === PREFERRED_VARIABLE) ??
    options.find((row) => row.source === PREFERRED_SOURCE) ??
    options[0]
  );
}
