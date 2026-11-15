import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import {
  archiveHref,
  clearFilters,
  COLLECTION_IDS,
  FACET_KEYS,
  toggleCollection,
  type ArchiveState,
  type CollectionId,
  type FacetCounts,
  type FacetKey,
} from "../../domain/archive";
import type { Strength } from "../../domain/trend-stats";
import { EvidenceMeter } from "../evidence-meter";
import { AutoSubmitCheckbox } from "./auto-submit-checkbox";
import { FACET_TITLE_KEYS, facetOptionIcon, facetOptionLabel } from "./filter-label";

/*
 * The facet rail (POC renderArchive facets): one collapsible group per facet with a count per
 * option, and the curated shelves. Facet checkboxes belong to the archive's GET form and submit it
 * on change; shelves are single-choice, so they are plain links that toggle.
 */

const TEXT_ACTION =
  "text-label-s text-text-link rounded-xs px-1 underline-offset-2 hover:underline focus-visible:focus-ring focus-visible:outline-focus-ring";

const DIRECTION_ICON: Record<string, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-neutral",
};

const STRENGTHS: readonly string[] = ["strong", "moderate", "weak"];
const isStrength = (value: string): value is Strength => STRENGTHS.includes(value);

type FacetFiltersProps = {
  state: ArchiveState;
  options: Record<FacetKey, string[]>;
  counts: FacetCounts;
  collectionCounts: Record<CollectionId, number>;
  translator: Translator;
};

export function FacetFilters({
  state,
  options,
  counts,
  collectionCounts,
  translator,
}: FacetFiltersProps) {
  const { t } = translator;
  const hasSelection = Boolean(state.col) || FACET_KEYS.some((key) => state.facets[key].length > 0);
  return (
    <aside
      aria-labelledby="archive-filters-title"
      className="rounded-surface bg-bg-surface shadow-card expanded:sticky expanded:top-4 flex flex-col gap-2 self-start p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="archive-filters-title"
          className="text-heading-h4 text-text-primary flex items-center gap-2"
        >
          <Icon name="funnel" />
          {t("f.filters")}
        </h2>
        {hasSelection ? (
          <Link href={archiveHref(clearFilters(state))} className={TEXT_ACTION}>
            {t("f.clear")}
          </Link>
        ) : null}
      </div>
      {FACET_KEYS.map((key) => (
        <FacetGroup
          key={key}
          facet={key}
          state={state}
          options={options[key]}
          counts={counts[key]}
          translator={translator}
        />
      ))}
      <details className="group/facet border-border-subtle border-t pt-2" open={Boolean(state.col)}>
        <summary className="text-label-l text-text-primary min-h-touch-min focus-visible:focus-ring focus-visible:outline-focus-ring flex cursor-pointer list-none items-center gap-2 rounded-sm px-1">
          <span className="flex-1">{t("arch.collections")}</span>
          <span className="text-icon-secondary transition-transform group-open/facet:rotate-180">
            <Icon name="caret-down" />
          </span>
        </summary>
        <ul className="flex flex-col gap-0.5 pb-1">
          {COLLECTION_IDS.filter((id) => collectionCounts[id] > 0 || state.col === id).map((id) => {
            const isSelected = state.col === id;
            return (
              <li key={id}>
                <Link
                  href={archiveHref(toggleCollection(state, id))}
                  aria-current={isSelected ? "true" : undefined}
                  title={t(`col.${id}.d`)}
                  className="text-body-s text-text-primary hover:bg-bg-hover aria-[current=true]:bg-action-selected aria-[current=true]:text-text-brand focus-visible:focus-ring focus-visible:outline-focus-ring flex min-h-9 items-center gap-2 rounded-sm px-2 no-underline"
                >
                  <span className={isSelected ? "text-text-brand" : "invisible"}>
                    <Icon name="check" size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">{t(`col.${id}`)}</span>
                  <span className="text-caption text-text-tertiary tabular-nums">
                    {collectionCounts[id]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </aside>
  );
}

type FacetGroupProps = {
  facet: FacetKey;
  state: ArchiveState;
  options: string[];
  counts: Record<string, number>;
  translator: Translator;
};

function FacetGroup({ facet, state, options, counts, translator }: FacetGroupProps) {
  const { t } = translator;
  const selected = state.facets[facet];
  // An option that would give nothing is hidden, unless it is the reason for an empty result.
  const visible = options.filter((value) => (counts[value] ?? 0) > 0 || selected.includes(value));
  const clearHref = archiveHref({ ...state, facets: { ...state.facets, [facet]: [] } });
  return (
    <details
      className="group/facet border-border-subtle border-t pt-2 first-of-type:border-t-0"
      open={facet === "region" || selected.length > 0}
    >
      <summary className="text-label-l text-text-primary min-h-touch-min focus-visible:focus-ring focus-visible:outline-focus-ring flex cursor-pointer list-none items-center gap-2 rounded-sm px-1">
        <span className="flex-1">{t(FACET_TITLE_KEYS[facet])}</span>
        {selected.length ? (
          <span className="text-caption text-text-brand tabular-nums">{selected.length}</span>
        ) : null}
        <span className="text-icon-secondary transition-transform group-open/facet:rotate-180">
          <Icon name="caret-down" />
        </span>
      </summary>
      <fieldset className="flex flex-col gap-0.5 pb-1">
        <legend className="sr-only">{t(FACET_TITLE_KEYS[facet])}</legend>
        {visible.map((value) => {
          const icon = facetOptionIcon(facet, value, translator);
          const label = facetOptionLabel(facet, value, translator);
          return (
            <label
              key={value}
              className="text-body-s text-text-primary hover:bg-bg-hover has-checked:bg-action-selected flex min-h-9 cursor-pointer items-center gap-2 rounded-sm px-2"
            >
              <AutoSubmitCheckbox name={facet} value={value} isChecked={selected.includes(value)} />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                {facet === "ev" && isStrength(value) ? (
                  <EvidenceMeter strength={value} word={label} isWordHidden />
                ) : null}
                {icon ? (
                  <span className={facet === "dir" ? DIRECTION_ICON[value] : "text-icon-secondary"}>
                    <Icon name={icon} />
                  </span>
                ) : null}
                <span aria-hidden={facet === "ev" ? "true" : undefined}>{label}</span>
              </span>
              <span className="text-caption text-text-tertiary tabular-nums">
                {counts[value] ?? 0}
              </span>
            </label>
          );
        })}
      </fieldset>
      {selected.length ? (
        <Link href={clearHref} className={TEXT_ACTION}>
          {t("f.clear.one")}
        </Link>
      ) : null}
    </details>
  );
}
