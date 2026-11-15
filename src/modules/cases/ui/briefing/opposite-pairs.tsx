import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { period, trendDirection, type Direction, type TrendCase } from "../../domain/case-file";
import type { CaseCatalog } from "../../domain/catalog";
import { changeLabel, fileName } from "../../domain/file-text";

type OppositePairsProps = {
  pairs: [TrendCase, TrendCase][];
  translator: Translator;
  catalog: CaseCatalog;
};

/*
 * Night block of opposite-trend pairs (POC renderBriefing L667-689, DESIGN.md "Opposite-trend
 * pair"): two raised sides with their direction figure in the night signals, joined by an icon.
 */

// The day signals are too dark on the night sky; the DS ships night variants as palette tokens only.
const NIGHT_INK: Record<Direction, string> = {
  up: "text-[var(--hexalis-signal-up-night)]",
  down: "text-[var(--hexalis-signal-down-night)]",
  flat: "text-text-inverse",
};

const SIDE_LINK = [
  "flex flex-col gap-1 rounded-card bg-bg-on-inverse-subtle p-4 text-text-inverse no-underline",
  "transition-transform duration-fast ease-standard hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

function PairSide({
  file,
  translator,
  catalog,
}: { file: TrendCase } & Omit<OppositePairsProps, "pairs">) {
  const direction = trendDirection(file.t);
  const { from, to } = period(file.series);
  return (
    <Link href={`/cases/${file.id}`} className={SIDE_LINK}>
      <span
        className={`text-heading-h3 font-display flex items-center gap-1.5 tabular-nums ${NIGHT_INK[direction]}`}
      >
        <Icon name={direction} />
        {changeLabel(file, { translator })}
      </span>
      <strong className="text-label-l">{fileName(file, { translator, catalog })}</strong>
      <span className="text-body-s opacity-80">
        {translator.t(`reg.${file.region}`)} · {from}–{to}
      </span>
    </Link>
  );
}

export function OppositePairs({ pairs, translator, catalog }: OppositePairsProps) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="pairs-title"
      className="rounded-shell bg-bg-inverse text-text-inverse medium:p-10 flex flex-col gap-6 p-6 shadow-[0_7px_0_var(--color-surface-tone-inverse-edge)]"
    >
      <div className="flex max-w-[68ch] flex-col gap-2">
        <h2 id="pairs-title" className="text-heading-h2 font-display text-balance">
          {t("brief.pairs.title")}
        </h2>
        <p className="text-body-l opacity-85">{t("brief.pairs.lead")}</p>
      </div>
      <div className="expanded:grid-cols-2 grid gap-5">
        {pairs.map(([first, second]) => (
          <article key={first.id} className="flex flex-col gap-3">
            <h3 className="text-overline flex items-center gap-2 font-sans">
              <Icon name={first.theme} />
              {t(`var.${first.variable}`)}
            </h3>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
              <PairSide file={first} translator={translator} catalog={catalog} />
              <span aria-hidden="true" className="self-center">
                <Icon name="flat" />
              </span>
              <PairSide file={second} translator={translator} catalog={catalog} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
