import type { Metadata } from "next";
import { Suspense } from "react";
import { getCaseCatalog, getCaseSummaries, getEventAudit } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { pickExploreMessages } from "@/modules/explore/domain/explore-copy";
import { initialSelection, parseExploreQuery } from "@/modules/explore/domain/explore-state";
import { isSectorId } from "@/modules/explore/domain/sectors";
import { ExploreScreen } from "@/modules/explore/ui/explore-screen";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: "3D globe" };

type PageProps = { searchParams: Promise<SearchParams> };

/** The language cookie and the selection in the URL are request data, so they are read inside Suspense. */
async function ExploreContent({ searchParams }: PageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const translator = getTranslator(locale);
  const catalog = getCaseCatalog();
  const audit = getEventAudit();
  const files = getCaseSummaries(catalog, translator);
  const regionOf = new Map(files.map((file) => [file.id, file.region]));
  const defaultYear = audit.lastCompleteYear;
  const query = parseExploreQuery(
    params,
    {
      caseRegion: (id) => {
        const region = regionOf.get(id);
        return isSectorId(region) ? region : undefined;
      },
    },
    // The snapshot holds one file per year, the running one included.
    { firstYear: audit.firstYear, lastYear: audit.lastCompleteYear + 1, defaultYear },
  );
  const { t } = translator;

  return (
    <div lang={locale}>
      <ExploreScreen
        locale={locale}
        frameSrc={`/globe/world3d/index.html?embed=1&lang=${locale}`}
        frameTitle={t("exp.view.3d.title")}
        heading={t("exp.title")}
        viewerLabel={t("exp.viewer")}
        files={files}
        messages={pickExploreMessages(translator)}
        sources={audit.sources}
        windowDays={catalog.eventWindowDays}
        query={query}
        defaultYear={defaultYear}
        initial={initialSelection(query.open)}
      />
    </div>
  );
}

export default function ExplorePage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-bg-inverse grid h-[calc(100dvh-6.5rem)] min-h-[30rem] place-items-center p-4">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </div>
      }
    >
      <ExploreContent searchParams={searchParams} />
    </Suspense>
  );
}
