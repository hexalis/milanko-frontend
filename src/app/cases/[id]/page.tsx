import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslator } from "@/modules/copy";
import { findCaseFile, getCaseCatalog } from "@/modules/cases/domain/catalog";
import { isEvent } from "@/modules/cases/domain/case-file";
import { fileTitle } from "@/modules/cases/domain/file-text";
import { EventDossier } from "@/modules/cases/ui/dossier/event-dossier";
import { TrendDossier } from "@/modules/cases/ui/dossier/trend-dossier";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

type PageProps = { params: Promise<{ id: string }> };

/** The 6 trend cases and 32 anomaly files are static data: every file page is known at build time. */
export function generateStaticParams() {
  return getCaseCatalog().all.map((file) => ({ id: file.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const file = findCaseFile(id);
  if (!file) return {};
  // Metadata uses the default language; the page itself follows the reader's choice.
  return {
    title: fileTitle(file, {
      translator: getTranslator(DEFAULT_LOCALE),
      catalog: getCaseCatalog(),
    }),
  };
}

/** Reads the language cookie, so it renders inside Suspense. */
async function CaseFileContent({ id }: { id: string }) {
  const file = findCaseFile(id);
  if (!file) notFound();
  const locale = await getLocale();
  const translator = getTranslator(locale);
  const catalog = getCaseCatalog();
  return (
    <div lang={locale}>
      {isEvent(file) ? (
        <EventDossier file={file} translator={translator} catalog={catalog} />
      ) : (
        <TrendDossier file={file} translator={translator} catalog={catalog} />
      )}
    </div>
  );
}

export default async function CaseFilePage({ params }: PageProps) {
  // Checked before Suspense so an unknown id answers 404 instead of a streamed 200.
  const { id } = await params;
  if (!findCaseFile(id)) notFound();
  return (
    <Suspense
      fallback={
        <div className="max-w-content-max mx-auto w-full px-4 py-8">
          <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
        </div>
      }
    >
      <CaseFileContent id={id} />
    </Suspense>
  );
}
