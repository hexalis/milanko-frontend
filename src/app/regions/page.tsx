import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { listVariableOptions, pickVariable } from "@/modules/coverage";
import { pickRegion } from "@/modules/regions/domain/region";
import { RegionExplorerScreen, type Loaded } from "@/modules/regions/ui/region-explorer-screen";
import { getCoverage } from "@/server/integrations/milanko-api/coverage";
import {
  getRegionAnomalies,
  getRegionEvents,
  getRegionLatest,
  getRegionObservations,
  getRegions,
  getRegionTrend,
  MAX_OBSERVATIONS,
} from "@/server/integrations/milanko-api/regions";
import {
  isoDaysAgo,
  lastDaysRange,
  orderedRange,
  readIsoDate,
  readString,
  todayIsoDate,
  type SearchParams,
} from "@/shared/lib/search-params";
import { LoadingPanel, Notice } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";

export const metadata: Metadata = { title: "Explorador de regiones" };

/** Start of the persisted record; trends and anomalies always use the full history. */
const RECORD_START = "2006-01-01";
const ANOMALY_WINDOW_DAYS = 365;
const LAST_MONTH_DAYS = 30;

type PageProps = { searchParams: Promise<SearchParams> };

function settle<T>(promise: Promise<T>): Promise<Loaded<T>> {
  return promise.then(
    (data) => ({ data }),
    (error: unknown) => ({ error: error instanceof Error ? error.message : "error desconocido" }),
  );
}

async function RegionContent({ searchParams }: PageProps) {
  const params = await searchParams;
  await connection();
  const [regions, coverage] = await Promise.all([getRegions(), getCoverage()]);
  const variables = listVariableOptions(coverage);
  const region = pickRegion(regions, readString(params, "region"));
  const variable = pickVariable(variables, readString(params, "variable"));
  if (!region || !variable)
    return <Notice tone="error">La API no tiene regiones o variables persistidas.</Notice>;

  const { start, end } = orderedRange(
    readIsoDate(params, "start") ?? RECORD_START,
    readIsoDate(params, "end") ?? todayIsoDate(),
  );
  const series = { variable: variable.variable, end, source: variable.source };
  const [observations, trend, anomalies, latest, events] = await Promise.all([
    getRegionObservations(region.code, { variable: variable.variable, start, end }),
    settle(getRegionTrend(region.code, { ...series, start: RECORD_START })),
    settle(getRegionAnomalies(region.code, { ...series, start: RECORD_START })),
    settle(getRegionLatest(region.code)),
    settle(getRegionEvents(region.code)),
  ]);

  return (
    <RegionExplorerScreen
      regions={regions}
      variables={variables}
      query={{
        region: observations.region,
        variable,
        start,
        end,
        anomalySince: isoDaysAgo(ANOMALY_WINDOW_DAYS, new Date(`${end}T00:00:00Z`)),
        lastMonth: lastDaysRange(LAST_MONTH_DAYS),
      }}
      observations={observations.observations}
      trend={trend}
      anomalies={anomalies}
      latest={latest}
      events={events}
      maxObservations={MAX_OBSERVATIONS}
    />
  );
}

export default function RegionsPage({ searchParams }: PageProps) {
  return (
    <PageShell
      kicker="Earth Trend Detective · datos persistidos"
      title="Explorador de regiones"
      lead="Elige una de las 162 regiones y una variable: serie guardada, tendencia de todo el registro, anomalías y eventos de la zona."
    >
      <Suspense fallback={<LoadingPanel label="Consultando la región…" />}>
        <RegionContent searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
