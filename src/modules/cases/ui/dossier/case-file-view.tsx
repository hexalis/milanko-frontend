import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import type { CaseReading } from "../../domain/case-reading";
import { NextCase } from "./next-case";
import { ReadingHead } from "./reading-answer";
import {
  DataSection,
  NotSaySection,
  SourceSection,
  SureSection,
  WhySection,
} from "./reading-sections";
import { UseSection } from "./reading-use";

/*
 * The one case-file template (POC renderFile, d2de23a): trend files, anomaly files and catalog
 * audits read as the same seven sections, each a plain sentence over the exact figures.
 */

type CaseFileViewProps = {
  reading: CaseReading;
  translator: Translator;
  /** The page's tour button, beside the breadcrumb. */
  tour?: ReactNode;
};

export function CaseFileView({ reading, translator, tour }: CaseFileViewProps) {
  const { t } = translator;
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-16">
      <article className="flex max-w-[780px] flex-col gap-3.5">
        <ReadingHead reading={reading} translator={translator} tour={tour} />
        <div className="mt-6 flex flex-col gap-10">
          <DataSection reading={reading} translator={translator} />
          <SureSection reading={reading} translator={translator} />
          <NotSaySection reading={reading} translator={translator} />
          <WhySection reading={reading} translator={translator} />
          <SourceSection reading={reading} translator={translator} />
          <UseSection reading={reading} translator={translator} />
          <NextCase
            label={t("case.next.label")}
            relatedLabel={t("case.related")}
            next={reading.next}
          />
        </div>
      </article>
    </main>
  );
}
