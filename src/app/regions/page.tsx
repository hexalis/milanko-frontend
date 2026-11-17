import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getTranslator } from "@/modules/copy";
import { listVariableOptions, pickVariable } from "@/modules/coverage";
import { readPlace } from "@/modules/regions/domain/reading";
import { pickRegion } from "@/modules/regions/domain/region";
import { RegionExplorerScreen, type Loaded } from "@/modules/regions/ui/region-explorer-screen";
import { REGION_TABS } from "@/modules/regions/ui/region-tabs";
import { PageTour } from "@/modules/tour/ui/page-tour";
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
import { getLocale } from "@/server/locale";
import type { Translator } from "@/shared/lib/i18n";
import {
  isoDaysAgo,
  lastDaysRange,
  orderedRange,
  readIsoDate,
  readOption,
  readString,
  todayIsoDate,
  type SearchParams,
} from "@/shared/lib/search-params";
import { LoadingPanel, Notice } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getTranslator(await getLocale());
  return { title: t("rx.meta") };
}

/** Start of the persisted record; trends and anomalies always use the full history. */
const RECORD_START = "2006-01-01";
const ANOMALY_WINDOW_DAYS = 365;
const LAST_MONTH_DAYS = 30;

type PageProps = { searchParams: Promise<SearchParams> };

function settle<T>(promise: Promise<T>, fallback: string): Promise<Loaded<T>> {
  return promise.then(
    (data) => ({ data }),
    (error: unknown) => ({ error: error instanceof Error ? error.message : fallback }),
  );
}

async function RegionContent({
  params,
  translator,
}: {
  params: SearchParams;
  translator: Translator;
}) {
  await connection();
  const [regions, coverage] = await Promise.all([getRegions(), getCoverage()]);
  const variables = listVariableOptions(coverage);
  const region = pickRegion(regions, readString(params, "region"));
  const variable = pickVariable(variables, readString(params, "variable"));
  if (!region || !variable) return <Notice tone="error">{translator.t("rx.noapi")}</Notice>;

  const { start, end } = orderedRange(
    readIsoDate(params, "start") ?? RECORD_START,
    readIsoDate(params, "end") ?? todayIsoDate(),
  );
  const series = { variable: variable.variable, end, source: variable.source };
  const unknown = "?";
  const [observations, trend, anomalies, latest, events] = await Promise.all([
    getRegionObservations(region.code, { variable: variable.variable, start, end }),
    settle(getRegionTrend(region.code, { ...series, start: RECORD_START }), unknown),
    settle(getRegionAnomalies(region.code, { ...series, start: RECORD_START }), unknown),
    settle(getRegionLatest(region.code), unknown),
    settle(getRegionEvents(region.code), unknown),
  ]);

  return (
    <RegionExplorerScreen
      translator={translator}
      regions={regions}
      variables={variables}
      query={{
        region: observations.region,
        variable,
        start,
        end,
        place: readPlace(readString(params, "place")),
        tab: readOption(params, "tab", REGION_TABS, "history"),
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

/** The language cookie and the query are request data, so they are read inside Suspense. */
async function RegionPage({ searchParams }: PageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const translator = getTranslator(locale);
  const { t } = translator;
  return (
    <PageShell
      lang={locale}
      aside={<PageTour id="region" translator={translator} />}
      kicker={t("rx.kicker")}
      title={t("rx.meta")}
      lead={t("rx.lead")}
    >
      <Suspense fallback={<LoadingPanel label={t("rx.loading")} />}>
        <RegionContent params={params} translator={translator} />
      </Suspense>
    </PageShell>
  );
}

export default function RegionsPage(props: PageProps) {
  return (
    <Suspense fallback={<LoadingPanel label="…" />}>
      <RegionPage {...props} />
    </Suspense>
  );
}
