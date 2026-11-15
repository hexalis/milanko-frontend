import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslator } from "@/modules/copy";
import { findCaseFile, getCaseCatalog } from "@/modules/cases/domain/catalog";
import { getEventAudit } from "@/modules/cases/domain/event-audit";
import { caseFileIds, findReading, hasCaseFile } from "@/modules/cases/domain/reading";
import { CaseFileView } from "@/modules/cases/ui/dossier/case-file-view";
import { CaseVisitRecorder } from "@/modules/workspace/ui/case-visit-recorder";
import { getLocale } from "@/server/locale";
import { DEFAULT_LOCALE, type Locale } from "@/shared/lib/i18n";
import { LoadingPanel } from "@/shared/ui/notice";

type PageProps = { params: Promise<{ id: string }> };

/** The trend cases, the anomaly files and the audit categories are static data: all known at build time. */
export function generateStaticParams() {
  return caseFileIds().map((id) => ({ id }));
}

const readingContext = (locale: Locale) => ({
  translator: getTranslator(locale),
  catalog: getCaseCatalog(),
  audit: getEventAudit(),
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Metadata uses the default language; the page itself follows the reader's choice.
  const reading = findReading(id, readingContext(DEFAULT_LOCALE));
  return reading ? { title: reading.question } : {};
}

/** Reads the language cookie, so it renders inside Suspense. */
async function CaseFileContent({ id }: { id: string }) {
  const locale = await getLocale();
  const context = readingContext(locale);
  const reading = findReading(id, context);
  if (!reading) notFound();
  return (
    <div lang={locale}>
      <CaseFileView reading={reading} translator={context.translator} />
    </div>
  );
}

export default async function CaseFilePage({ params }: PageProps) {
  // Checked before Suspense so an unknown id answers 404 instead of a streamed 200.
  const { id } = await params;
  if (!hasCaseFile(id)) notFound();
  return (
    <>
      {/* Like the POC (markRead), only trend and anomaly files count as read; audit files do not. */}
      {findCaseFile(id) ? <CaseVisitRecorder id={id} /> : null}
      <Suspense
        fallback={
          <div className="max-w-content-max mx-auto w-full px-4 py-8">
            <LoadingPanel label={getTranslator(DEFAULT_LOCALE).t("pt.loading")} />
          </div>
        }
      >
        <CaseFileContent id={id} />
      </Suspense>
    </>
  );
}
