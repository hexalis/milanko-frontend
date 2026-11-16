import type { Metadata } from "next";
import { Suspense } from "react";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { MethodScreen } from "@/modules/method/ui/method-screen";
import { PageTour } from "@/modules/tour/ui/page-tour";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("nav.method") };

/** Reads the language cookie, so it renders inside Suspense. */
async function MethodContent() {
  const locale = await getLocale();
  return (
    <div lang={locale}>
      <MethodScreen
        catalog={getCaseCatalog()}
        translator={getTranslator(locale)}
        tour={<PageTour id="method" translator={getTranslator(locale)} />}
      />
    </div>
  );
}

export default function MethodPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <MethodContent />
    </Suspense>
  );
}
