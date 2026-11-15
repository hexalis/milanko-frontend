import type { Metadata } from "next";
import { Suspense } from "react";
import { parseArchiveState } from "@/modules/cases/domain/archive";
import { getCaseCatalog } from "@/modules/cases/domain/catalog";
import { ArchiveScreen } from "@/modules/cases/ui/archive/archive-screen";
import { getTranslator } from "@/modules/copy";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { readString, type SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: "Case Files" };

type PageProps = { searchParams: Promise<SearchParams> };

/** The language cookie and the filters are request data, so they are read inside Suspense. */
async function ArchiveContent({ searchParams }: PageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const catalog = getCaseCatalog();
  return (
    <div lang={locale}>
      <ArchiveScreen
        state={parseArchiveState(params, catalog)}
        catalog={catalog}
        locale={locale}
        isSearchFocused={readString(params, "focus") === "1"}
      />
    </div>
  );
}

export default function CasesPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <ArchiveContent searchParams={searchParams} />
    </Suspense>
  );
}
