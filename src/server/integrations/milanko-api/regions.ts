import { cacheLife } from "next/cache";
import type { AnomalyPoint, RegionTrend } from "@/modules/regions/domain/analysis";
import type { Ranking, RankingQuery } from "@/modules/regions/domain/ranking";
import type { LatestVariable, Region, RegionEvent } from "@/modules/regions/domain/region";
import type { Observation } from "@/modules/regions/domain/series";
import { createMilankoClient, isRecord, unwrap } from "./client";

/** The 162 regions are fixed by the grid version; cache them for hours. */
export async function getRegions(): Promise<Region[]> {
  "use cache";
  cacheLife("hours");
  const data = await unwrap(createMilankoClient().GET("/regions"));
  return data.regions;
}

type SeriesQuery = { variable: string; start: string; end: string };

export const MAX_OBSERVATIONS = 20_000;

export async function getRegionObservations(
  code: number,
  { variable, start, end }: SeriesQuery,
): Promise<{ region: Region; observations: Observation[] }> {
  const data = await unwrap(
    createMilankoClient().GET("/regions/{region_code}/observations", {
      params: {
        path: { region_code: code },
        query: { variables: variable, start, end, limit: MAX_OBSERVATIONS },
      },
    }),
  );
  return { region: data.region, observations: data.observations };
}

export async function getRegionLatest(code: number): Promise<LatestVariable[]> {
  const data = await unwrap(
    createMilankoClient().GET("/regions/{region_code}/latest", {
      params: { path: { region_code: code } },
    }),
  );
  return data.variables;
}

const REGION_EVENTS_LIMIT = 20;

export async function getRegionEvents(
  code: number,
): Promise<{ total: number; events: RegionEvent[] }> {
  const data = await unwrap(
    createMilankoClient().GET("/regions/{region_code}/events", {
      params: { path: { region_code: code }, query: { limit: REGION_EVENTS_LIMIT } },
    }),
  );
  return { total: data.count, events: data.events };
}

/* Trends and anomalies are untyped in the OpenAPI document; narrow them at the edge. */

const optionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export async function getRegionTrend(
  code: number,
  { variable, start, end, source }: SeriesQuery & { source: string },
): Promise<RegionTrend | null> {
  const data = await unwrap(
    createMilankoClient().GET("/regions/{region_code}/trends", {
      params: { path: { region_code: code }, query: { variables: variable, start, end, source } },
    }),
  );
  const trend = isRecord(data.trends) ? data.trends[variable] : undefined;
  if (!isRecord(trend)) return null;
  const mannKendall = isRecord(trend.mann_kendall) ? trend.mann_kendall : {};
  return {
    n_months: optionalNumber(trend.n_months) ?? 0,
    sen_slope_per_year: optionalNumber(trend.sen_slope_per_year),
    mann_kendall: {
      trend: typeof mannKendall.trend === "string" ? mannKendall.trend : null,
      p_value: optionalNumber(mannKendall.p_value),
    },
  };
}

export async function getRegionAnomalies(
  code: number,
  { variable, start, end, source }: SeriesQuery & { source: string },
): Promise<AnomalyPoint[]> {
  const data = await unwrap(
    createMilankoClient().GET("/regions/{region_code}/anomalies", {
      params: { path: { region_code: code }, query: { variables: variable, start, end, source } },
    }),
  );
  const rows = isRecord(data.variables) ? data.variables[variable] : undefined;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) =>
    isRecord(row) && typeof row.time === "string"
      ? [
          {
            time: row.time,
            anomaly: optionalNumber(row.anomaly),
            z: optionalNumber(row.z),
            percentile: optionalNumber(row.percentile),
          },
        ]
      : [],
  );
}

export async function getRegionRanking({
  variable,
  metric,
  order,
  limit,
  date,
}: RankingQuery): Promise<Ranking> {
  return unwrap(
    createMilankoClient().GET("/regions/rankings", {
      params: {
        query: {
          variable,
          metric,
          order,
          limit: Number(limit),
          date: metric === "trend" ? undefined : date,
        },
      },
    }),
  );
}
