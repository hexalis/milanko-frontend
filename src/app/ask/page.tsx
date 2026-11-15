import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { DEPTH_COOKIE, withRememberedDepth } from "@/modules/ask/domain/ask-state";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { AskPickScreen } from "@/modules/ask/ui/ask-pick-screen";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("nav.ask") };

type PageProps = { searchParams: Promise<SearchParams> };

/** The language cookie and the question being built are request data, so they are read inside Suspense. */
async function AskPickContent({ searchParams }: PageProps) {
  const [query, locale, jar] = await Promise.all([searchParams, getLocale(), cookies()]);
  const params = withRememberedDepth(query, jar.get(DEPTH_COOKIE)?.value);
  return (
    <div lang={locale}>
      <AskPickScreen
        params={params}
        translator={getTranslator(locale)}
        catalog={getCaseCatalog()}
      />
    </div>
  );
}

export default function AskPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <AskPickContent searchParams={searchParams} />
    </Suspense>
  );
}
