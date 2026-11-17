import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRules } from "@/modules/ask/domain/engine";
import { parseLiveVariable, parsePoint, pointFile } from "@/modules/ask/domain/place";
import { PlaceScreen, type PlaceResult } from "@/modules/ask/ui/place-screen";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { getPointMonthly } from "@/server/integrations/milanko-api/observations";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import type { SearchParams } from "@/shared/lib/search-params";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("place.crumb") };

type PageProps = { searchParams: Promise<SearchParams> };

/** The point and variable live in the query; NASA's series for them is read from the API. */
async function PlaceContent({ searchParams }: PageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const point = parsePoint(params);
  if (!point) notFound();
  const variable = parseLiveVariable(params);
  let result: PlaceResult;
  try {
    const values = await getPointMonthly(point.lat, point.lon, variable);
    const file = pointFile(point, variable, values);
    result = file ? { status: "ok", file } : { status: "too-short" };
  } catch {
    result = { status: "failed" };
  }
  const { global } = getCaseCatalog();
  const cautions = getRules()
    .cautions(point.lat, point.lon)
    .filter((caution) => caution.variables.includes(variable))
    .map((caution) => caution.id);
  return (
    <div lang={locale}>
      <PlaceScreen
        point={point}
        variable={variable}
        result={result}
        cautions={cautions}
        planet={{ perDecade: global.perDecade, points: global.points }}
        translator={getTranslator(locale)}
      />
    </div>
  );
}

export default function PlacePage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <PlaceContent searchParams={searchParams} />
    </Suspense>
  );
}
