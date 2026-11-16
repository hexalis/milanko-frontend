import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { VerdictStamp } from "../verdict-stamp";

/*
 * How to read a case file: the three sheets that rise out of every folder (series, test, source),
 * each told twice, once in plain words and once for scientists, so the same page works for a
 * child, a curious reader and a researcher. The sheets are drawn as the folder draws them.
 */

const SHEETS = [
  { key: "1", label: "sheet.series", icon: "chart" },
  { key: "2", label: "sheet.test", icon: "method-on" },
  { key: "3", label: "sheet.source", icon: "audit" },
] as const;

export function ReadAFile({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <section aria-labelledby="read-title" data-tour="brief-read" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id="read-title" className="text-heading-h2 font-display text-text-primary">
          {t("brief.read.title")}
        </h2>
        <p className="text-body-m text-text-secondary max-w-[60ch]">{t("brief.read.lead")}</p>
      </div>
      <ol className="medium:grid-cols-3 grid gap-4">
        {SHEETS.map((sheet, index) => (
          <li
            key={sheet.key}
            className="rounded-card bg-bg-surface-raised shadow-card flex flex-col gap-3 p-5"
          >
            <p className="border-border-subtle text-label-m flex items-center gap-2 border-b pb-2">
              <span className="text-text-brand">
                <Icon name={sheet.icon} />
              </span>
              <span className="text-text-primary font-semibold">
                0{index + 1} · {t(sheet.label)}
              </span>
              <span className="text-text-tertiary border-border-subtle ms-auto border-s ps-2 tabular-nums">
                {index + 1}/{SHEETS.length}
              </span>
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-overline text-text-tertiary">{t("brief.read.simple")}</p>
              <p className="text-body-l font-reading text-text-primary">
                {t(`brief.read.${sheet.key}.simple`)}
              </p>
            </div>
            <div className="bg-bg-surface-sunken mt-auto flex flex-col gap-1 rounded-[14px] p-3">
              <p className="text-overline text-text-tertiary">{t("brief.read.science")}</p>
              <p className="text-body-s text-text-secondary">
                {t(`brief.read.${sheet.key}.science`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-body-m text-text-secondary flex flex-wrap items-center gap-3">
        <VerdictStamp verdict="confirmed" label={t("verdict.confirmed")} />
        <VerdictStamp verdict="inconclusive" label={t("verdict.inconclusive")} />
        <span className="min-w-[24ch] flex-1">{t("brief.read.verdict")}</span>
      </p>
    </section>
  );
}
