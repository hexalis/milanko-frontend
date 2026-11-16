import type { Metadata } from "next";
import { Suspense } from "react";
import { getCaseCatalog } from "@/modules/cases/domain/catalog";
import { getEventAudit } from "@/modules/cases/domain/event-audit";
import { BriefingScreen } from "@/modules/cases/ui/briefing/briefing-screen";
import { getTranslator } from "@/modules/copy";
import { PageTour } from "@/modules/tour/ui/page-tour";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: "Briefing" };

/** The language cookie is request data, so it is read inside Suspense; the data itself is static. */
async function BriefingContent() {
  const locale = await getLocale();
  return (
    <div lang={locale}>
      <BriefingScreen
        translator={getTranslator(locale)}
        tour={<PageTour id="briefing" translator={getTranslator(locale)} />}
        catalog={getCaseCatalog()}
        audit={getEventAudit()}
      />
    </div>
  );
}

export default function BriefingPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <BriefingContent />
    </Suspense>
  );
}
