import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { listVariableOptions, pickVariable } from "@/modules/coverage";
import { RANKING_LIMITS, RANKING_METRICS, RANKING_ORDERS } from "@/modules/regions/domain/ranking";
import { RankingsScreen } from "@/modules/regions/ui/rankings-screen";
import { getCoverage } from "@/server/integrations/milanko-api/coverage";
import { getRegionRanking } from "@/server/integrations/milanko-api/regions";
import {
  readIsoDate,
  readOption,
  readString,
  todayIsoDate,
  type SearchParams,
} from "@/shared/lib/search-params";
import { LoadingPanel, Notice } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";
import { getTranslator } from "@/modules/copy";
import { PageTour } from "@/modules/tour/ui/page-tour";

export const metadata: Metadata = { title: "Planet Pulse" };

type PageProps = { searchParams: Promise<SearchParams> };

async function RankingsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  await connection();
  const variables = listVariableOptions(await getCoverage());
  const variable = pickVariable(variables, readString(params, "variable"));
  if (!variable) return <Notice tone="error">La API no tiene variables persistidas.</Notice>;

  const query = {
    variable: variable.variable,
    metric: readOption(params, "metric", RANKING_METRICS, "anomaly"),
    order: readOption(params, "order", RANKING_ORDERS, "desc"),
    limit: readOption(params, "limit", RANKING_LIMITS, "10"),
    date: readIsoDate(params, "date") ?? todayIsoDate(),
  };
  const ranking = await getRegionRanking(query);
  return <RankingsScreen variables={variables} query={query} ranking={ranking} />;
}

export default function RankingsPage({ searchParams }: PageProps) {
  return (
    <PageShell
      lang="es"
      aside={<PageTour id="data" translator={getTranslator("es")} />}
      kicker="Earth Trend Detective · datos persistidos"
      title="Planet Pulse"
      lead="Las 162 regiones ordenadas por valor actual, anomalía mensual o tendencia de una variable."
    >
      <Suspense fallback={<LoadingPanel label="Cargando ranking…" />}>
        <RankingsContent searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
