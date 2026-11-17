import type { Metadata } from "next";
import { Suspense } from "react";
import { getCaseCatalog } from "@/modules/cases";
import { getTranslator } from "@/modules/copy";
import { PlaygroundScreen } from "@/modules/method/ui/playground-screen";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

export const metadata: Metadata = { title: getTranslator(DEFAULT_LOCALE).t("pg.title") };

/** Reads the language cookie, so it renders inside Suspense. */
async function PlaygroundContent() {
  const locale = await getLocale();
  return (
    <div lang={locale}>
      <PlaygroundScreen catalog={getCaseCatalog()} translator={getTranslator(locale)} />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </main>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
