import { emptyStateRecipe } from "@hexalis/components/themes";
import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import type { ActiveFilter } from "../../domain/archive";
import { activeFilterLabel } from "./filter-label";

/* Nothing matches: say so, name the filter worth dropping, and offer a reset (POC draw empty state). */

const empty = emptyStateRecipe({ size: "s" });

type ArchiveEmptyProps = {
  suggestion: { filter: ActiveFilter; n: number } | null;
  resetHref: string;
  translator: Translator;
};

export function ArchiveEmpty({ suggestion, resetHref, translator }: ArchiveEmptyProps) {
  const { t } = translator;
  // The search hint quotes the bare words itself.
  const suggestionLabel = suggestion
    ? suggestion.filter.type === "q"
      ? suggestion.filter.value
      : activeFilterLabel(suggestion.filter, translator)
    : null;
  return (
    <div className={`${empty.root()} rounded-card bg-bg-surface shadow-card`}>
      <span className={empty.icon()}>
        <Icon name="inconclusive" size="lg" />
      </span>
      <p className={empty.title()}>{t("arch.empty")}</p>
      {suggestion && suggestionLabel ? (
        <p className={empty.description()}>
          {t("arch.empty.hint", { f: suggestionLabel, n: suggestion.n })}
        </p>
      ) : null}
      <div className={empty.actions()}>
        <Link href={resetHref} className={buttonLink({ intent: "secondary" })}>
          {t("arch.empty.reset")}
        </Link>
      </div>
    </div>
  );
}
