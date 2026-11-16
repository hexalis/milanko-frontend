import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DEPTH_COOKIE } from "@/modules/ask/domain/ask-state";
import { compareSide, parseCompare } from "@/modules/ask/domain/compare";
import { getRules } from "@/modules/ask/domain/engine";
import { defaultDepth } from "@/modules/ask/domain/guided";
import { CompareScreen } from "@/modules/ask/ui/compare-screen";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { PageTour } from "@/modules/tour/ui/page-tour";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("ask.verb.comparison") };

type PageProps = { searchParams: Promise<SearchParams> };

/**
 * The two sides live in the query, which is request data: it is read inside Suspense, so an
 * invalid pair renders the not-found page within the streamed response.
 */
async function CompareContent({ searchParams }: PageProps) {
  const [params, locale, jar] = await Promise.all([searchParams, getLocale(), cookies()]);
  const rules = getRules();
  const catalog = getCaseCatalog();
  const query = parseCompare(rules, params);
  const a = query ? compareSide(query.a, catalog) : undefined;
  const b = query ? compareSide(query.b, catalog) : undefined;
  if (!query || !a || !b) notFound();
  return (
    <div lang={locale}>
      <CompareScreen
        query={query}
        sides={[a, b]}
        depth={defaultDepth(params, jar.get(DEPTH_COOKIE)?.value)}
        rules={rules}
        translator={getTranslator(locale)}
        catalog={catalog}
        tour={<PageTour id="compare" translator={getTranslator(locale)} />}
      />
    </div>
  );
}

export default function ComparePage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-content-max mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </div>
      }
    >
      <CompareContent searchParams={searchParams} />
    </Suspense>
  );
}
