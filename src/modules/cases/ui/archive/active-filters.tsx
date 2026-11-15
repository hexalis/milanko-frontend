import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import {
  activeFilters,
  archiveHref,
  clearFilters,
  withoutFilter,
  type ArchiveState,
} from "../../domain/archive";
import { activeFilterLabel } from "./filter-label";

/* Result count and one removable chip per filter in force (POC renderArchive "activebar"). */

const CHIP =
  "text-label-s text-text-primary border-border-strong bg-bg-surface hover:bg-bg-hover active:bg-bg-pressed focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex h-8 items-center gap-1.5 rounded-chip border px-3 no-underline";

type ActiveFiltersProps = {
  state: ArchiveState;
  /** Files shown and files under the current topic. */
  shown: number;
  total: number;
  translator: Translator;
};

export function ActiveFilters({ state, shown, total, translator }: ActiveFiltersProps) {
  const { t } = translator;
  const filters = activeFilters(state);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-body-s text-text-secondary" aria-live="polite">
        {shown === total
          ? t(total === 1 ? "arch.count.one" : "arch.count.all", { n: total })
          : t("arch.count", { n: shown, total })}
        {state.col ? <span> · {t(`col.${state.col}.d`)}</span> : null}
      </p>
      {filters.length ? (
        <ul className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const label = activeFilterLabel(filter, translator);
            return (
              <li
                key={`${filter.type}:${filter.type === "facet" ? filter.key : ""}:${filter.value}`}
              >
                <Link
                  href={archiveHref(withoutFilter(state, filter))}
                  aria-label={t("f.remove", { f: label })}
                  className={CHIP}
                >
                  {label}
                  <Icon name="x" size="sm" />
                </Link>
              </li>
            );
          })}
          {filters.length > 1 ? (
            <li>
              <Link
                href={archiveHref(clearFilters(state))}
                className="text-label-s text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring rounded-xs px-1 hover:underline"
              >
                {t("f.clear")}
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
