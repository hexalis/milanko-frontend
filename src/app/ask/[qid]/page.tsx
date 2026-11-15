import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  askHref,
  DEPTH_COOKIE,
  guidedQuestionIds,
  legacyScreen,
  parseHunch,
  parseReading,
  parseScreen,
  type Screen,
} from "@/modules/ask/domain/ask-state";
import { getRules } from "@/modules/ask/domain/engine";
import { defaultDepth, findTrend, openGuided, questionTitle } from "@/modules/ask/domain/guided";
import { GuidedScreen } from "@/modules/ask/ui/guided-screen";
import { getCaseCatalog, trendDirection } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import type { TourId } from "@/modules/tour/domain/tours";
import { PageTour } from "@/modules/tour/ui/page-tour";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

/** Route params can arrive percent-encoded ("soil_water%40chile-drying"); a malformed one is unknown. */
function decodeQid(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

type PageProps = { params: Promise<{ qid: string }>; searchParams: Promise<SearchParams> };

/** Each screen of the lesson has its own tour. */
const LESSON_TOURS = {
  look: "lesson-look",
  guess: "lesson-guess",
  check: "lesson-check",
  verdict: "lesson-verdict",
  done: "lesson-done",
} as const satisfies Record<Screen, TourId>;

/** Published questions and every composed POWER trend question are known at build time. */
export function generateStaticParams() {
  const catalog = getCaseCatalog();
  return guidedQuestionIds(getRules(), (id) => findTrend(catalog, id)).map((qid) => ({ qid }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const qid = decodeQid((await params).qid);
  const catalog = getCaseCatalog();
  const found = openGuided(getRules(), catalog, qid);
  if (!found) notFound();
  // Metadata uses the default language; the page itself follows the reader's choice.
  return {
    title: questionTitle(found.question, { translator: getTranslator(DEFAULT_LOCALE), catalog }),
  };
}

/**
 * Language and depth cookies and the screen in the URL are request data, so they render in
 * Suspense. An old `?step=N` link is sent on to the screen that now holds what that step showed.
 */
async function GuidedContent({
  qid,
  searchParams,
}: {
  qid: string;
  searchParams: Promise<SearchParams>;
}) {
  const rules = getRules();
  const catalog = getCaseCatalog();
  const found = openGuided(rules, catalog, qid);
  if (!found) notFound();
  const [query, locale, jar] = await Promise.all([searchParams, getLocale(), cookies()]);
  const state = {
    screen: parseScreen(query),
    depth: defaultDepth(query, jar.get(DEPTH_COOKIE)?.value),
    hunch: parseHunch(query),
    reading: parseReading(query),
  };
  if (legacyScreen(query)) redirect(askHref(found.question.id, state));
  const view = { ...found, ...state, direction: trendDirection(found.file.t) };
  const translator = getTranslator(locale);
  return (
    <div lang={locale}>
      <GuidedScreen
        view={view}
        translator={translator}
        catalog={catalog}
        rules={rules}
        tour={<PageTour id={LESSON_TOURS[state.screen]} translator={translator} />}
      />
    </div>
  );
}

export default async function GuidedQuestionPage({ params, searchParams }: PageProps) {
  // Checked before Suspense so an unknown question answers 404 instead of a streamed 200.
  const qid = decodeQid((await params).qid);
  if (!openGuided(getRules(), getCaseCatalog(), qid)) notFound();
  return (
    <Suspense
      fallback={
        <div className="max-w-content-max mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </div>
      }
    >
      <GuidedContent qid={qid} searchParams={searchParams} />
    </Suspense>
  );
}
