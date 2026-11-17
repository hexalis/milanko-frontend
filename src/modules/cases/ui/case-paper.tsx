import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import type { ReadingSheet } from "../domain/case-reading";

/*
 * One sheet of a case file, drawn as a real page (case-paper.css): the folder holds it, the
 * opening carries it to the middle of the screen, and the file's glance lays it on the desk.
 * Each level of evidence has its own paper, so the three read apart at a glance:
 *   01 the series on graph paper, with its chart;
 *   02 the test on a ruled pad with a red margin, with the bars it clears;
 *   03 the source on an index card.
 * The page carries the file's catalog number and its place in the file, like a filed sheet.
 * Paper stays light in both themes. Built from spans, so it can sit inside a folder's link.
 */

const PAPERS = ["graph", "pad", "card"] as const;

type PaperSheetProps = {
  sheet: ReadingSheet;
  index: number;
  count: number;
  /** The file's catalog number, printed at the head of every page. */
  code: string;
  /** The series drawn on the first sheet. */
  chart?: ReactNode;
  /** A sheet that cannot confirm its finding is drawn with a dashed edge. */
  isInconclusive?: boolean;
  translator: Translator;
};

export function PaperSheet({
  sheet,
  index,
  count,
  code,
  chart,
  isInconclusive = false,
  translator,
}: PaperSheetProps) {
  const { t } = translator;
  return (
    <span
      className={`pp pp-${PAPERS[index] ?? PAPERS[0]}`}
      data-inconclusive={isInconclusive || undefined}
    >
      <span aria-hidden="true" className="pp-holes">
        <i />
        <i />
      </span>
      <span className="pp-meta font-mono">
        <span>{code}</span>
        <span>{t("paper.page", { i: index + 1, n: count })}</span>
      </span>
      <span className="pp-folio font-mono">
        <b>
          0{index + 1} · {sheet.label}
        </b>
        {/* Shows on the part of the page that peeks out of the folder; the figure below says it. */}
        <span aria-hidden="true">{sheet.value}</span>
      </span>
      <span className="pp-value font-display">{sheet.value}</span>
      <span className="pp-note font-reading">{sheet.note}</span>
      {chart ? (
        <span aria-hidden="true" className="pp-chart">
          {chart}
        </span>
      ) : null}
      {sheet.checks ? (
        <span className="pp-checks font-mono">
          {sheet.checks.map((check) => (
            <span key={check.label} className="pp-check" data-passed={check.isPassed}>
              <Icon name={check.isPassed ? "check" : "x"} size="sm" />
              {check.label}
              <span className="sr-only">
                {t(check.isPassed ? "cf.sheet.check.yes" : "cf.sheet.check.no")}
              </span>
            </span>
          ))}
        </span>
      ) : null}
      <span aria-hidden="true" className="pp-foot font-mono">
        {index + 1}/{count}
      </span>
    </span>
  );
}
