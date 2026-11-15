import type { Metadata } from "next";
import { Suspense } from "react";
import { CoverageScreen } from "@/modules/coverage/ui/coverage-screen";
import { getCoverage } from "@/server/integrations/milanko-api/coverage";
import { readString, type SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";

export const metadata: Metadata = { title: "Inventario de datos" };

type PageProps = { searchParams: Promise<SearchParams> };

async function CoverageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const rows = await getCoverage();
  return (
    <CoverageScreen
      rows={rows}
      filters={{
        source: readString(params, "source"),
        query: readString(params, "q"),
        isSortedByCount: readString(params, "sort") === "rows",
      }}
    />
  );
}

export default function CoveragePage({ searchParams }: PageProps) {
  return (
    <PageShell kicker="Earth Trend Detective · datos persistidos" title="Inventario de datos">
      <Suspense fallback={<LoadingPanel label="Cargando cobertura…" />}>
        <CoverageContent searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
