import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { trendDirection, type Direction, type TrendCase } from "../../domain/case-file";
import type { CaseCatalog } from "../../domain/catalog";
import { fileName, rateLabel, strengthWord, themeLabel, trendText } from "../../domain/file-text";
import { EvidenceBlock, THEME_TONE } from "../dossier/doc-parts";
import { EvidenceMeter } from "../evidence-meter";
import { Sparkline } from "../sparkline";

type FeaturedCaseProps = { file: TrendCase; translator: Translator; catalog: CaseCatalog };

const DIRECTION_INK: Record<Direction, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-neutral",
};

/*
 * Theme block with the featured case (POC renderBriefing L723-740): the confirmed trend with the
 * most signal against noise. Deferred: the POC's "See on the globe" button (no explorer route yet).
 */
export function FeaturedCase({ file, translator, catalog }: FeaturedCaseProps) {
  const { t } = translator;
  const context = { translator, catalog };
  const direction = trendDirection(file.t);
  return (
    <section aria-labelledby="featured-title">
      <EvidenceBlock tone={THEME_TONE[file.theme] ?? "tide"}>
        <div className="expanded:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] grid items-center gap-8">
          <div className="flex flex-col gap-3">
            <h2 id="featured-title" className="text-heading-h2 font-display text-balance">
              {trendText(file, "title", context)}
            </h2>
            <p className="text-label-l text-text-secondary flex items-center gap-2">
              <Icon name={file.theme} />
              {themeLabel(file.theme, context)} · {fileName(file, context)}
            </p>
            <p className="text-body-l font-reading text-text-secondary max-w-[60ch]">
              {trendText(file, "summary", context)}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span
                className={`text-display-s font-display flex items-center gap-2 tabular-nums ${DIRECTION_INK[direction]}`}
              >
                <Icon name={direction} size="lg" />
                {rateLabel(file, context)}
              </span>
              <span className="text-body-m text-text-secondary">{t("perDecade")}</span>
              <EvidenceMeter strength={file.t.strength} word={strengthWord(file, context)} />
            </div>
            <div className="mt-1">
              <Link href={`/cases/${file.id}`} className={buttonLink({ intent: "secondary" })}>
                {t("openCase")}
                <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
          <div className="rounded-card bg-bg-surface/55 p-3">
            <Sparkline
              id={`featured-${file.id}`}
              series={file.series}
              trend={file.t}
              direction={direction}
            />
          </div>
        </div>
      </EvidenceBlock>
    </section>
  );
}
