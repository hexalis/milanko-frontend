import { Suspense } from "react";
import { getTranslator } from "@/modules/copy";
import { HomeScreen } from "@/modules/ask/ui/home-screen";
import { PageTour } from "@/modules/tour/ui/page-tour";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

/** The language cookie is request data, so it is read inside Suspense. */
async function HomeContent() {
  const locale = await getLocale();
  const translator = getTranslator(locale);
  return (
    <div lang={locale}>
      <HomeScreen translator={translator} tour={<PageTour id="home" translator={translator} />} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
