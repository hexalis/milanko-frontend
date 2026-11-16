import { Icon } from "@/shared/ui/icon";
import type { BuilderSegment } from "../domain/builder";
import type { BuilderChoice } from "../domain/builder-choices";
import { TILE_MAX, type Family } from "../domain/builder-view";
import { BuilderFold, CHOSEN_ROW } from "./builder-fold";
import { BuilderSegmentSelect, BuilderTile } from "./builder-segment-select";

/*
 * The options of one builder step (POC askBuilder `choose`): tiles (radio buttons) while they fit
 * at a glance, a dropdown for a long list, a folded card once a choice is made, and "Only option"
 * when there is nothing else to choose.
 */

type BuilderChoicesProps = {
  segment: BuilderSegment;
  /** The step's name, for the dropdown's label and the folded card's name. */
  label: string;
  choices: BuilderChoice[];
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const FAMILY_TILE: Record<Family | "plain", string> = {
  temperature: "bg-surface-tone-1 text-feedback-danger-fg",
  water: "bg-surface-tone-2 text-feedback-info-fg",
  vegetation: "bg-surface-tone-3 text-feedback-success-fg",
  ice: "bg-surface-tone-4 text-feedback-info-fg",
  earth: "bg-surface-tone-5 text-feedback-ai-fg",
  plain: "bg-bg-surface-sunken text-icon-secondary",
};

const TILE = [
  "group/tile relative flex min-h-16 cursor-pointer items-center gap-3 rounded-[18px] bg-bg-surface-sunken py-3 ps-3 pe-3.5",
  "text-body-m font-semibold text-text-primary",
  "shadow-[inset_0_0_0_1px_var(--color-border-subtle),0_3px_0_var(--color-border-default)]",
  "transition-[background-color,box-shadow,translate] duration-fast ease-standard",
  "hover:bg-bg-hover active:translate-y-0.5 motion-reduce:active:translate-y-0",
  "has-checked:bg-bg-surface has-checked:font-bold",
  "has-checked:shadow-[inset_0_0_0_2px_var(--color-action-primary),0_3px_0_var(--color-action-primary-pressed)]",
  "has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus-ring",
].join(" ");

const ROW_PILL =
  "inline-flex min-h-9 flex-none items-center gap-1.5 rounded-full bg-bg-surface-sunken px-3.5 text-label-m font-semibold transition-colors duration-fast";

function TileFace({ choice }: { choice: BuilderChoice }) {
  return (
    <>
      <span
        className={`grid size-[34px] flex-none place-items-center rounded-[11px] ${FAMILY_TILE[choice.family ?? "plain"]}`}
      >
        <Icon name={choice.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <span className="first-letter:uppercase">{choice.label}</span>
        {choice.hint ? (
          <span className="text-body-s text-text-secondary font-normal first-letter:uppercase">
            {choice.hint}
          </span>
        ) : null}
      </span>
    </>
  );
}

function Tiles({ segment, choices }: Pick<BuilderChoicesProps, "segment" | "choices">) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,196px),1fr))] gap-3">
      {choices.map((choice) => (
        <BuilderTile
          // Keyed by the URL's choice too: a back/forward that changes it remounts the radio, so a
          // checked state left by an earlier click never outlives the address.
          key={`${choice.id}:${choice.isChosen}`}
          className={TILE}
          segment={segment}
          value={choice.id}
          isChosen={choice.isChosen}
        >
          <TileFace choice={choice} />
          <span className="text-action-primary invisible flex-none group-has-checked/tile:visible">
            <Icon name="check" />
          </span>
        </BuilderTile>
      ))}
    </div>
  );
}

function LongList({ segment, label, choices, t }: BuilderChoicesProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <BuilderSegmentSelect segment={segment} urlValue={choices.find((c) => c.isChosen)?.id ?? ""}>
        <option value="">{t("ask.build.choose")}</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.hint ? `${choice.label} · ${choice.hint}` : choice.label}
          </option>
        ))}
      </BuilderSegmentSelect>
    </label>
  );
}

export function BuilderChoices(props: BuilderChoicesProps) {
  const { segment, label, choices, t } = props;
  if (choices.length > TILE_MAX) return <LongList {...props} />;
  const chosen = choices.find((choice) => choice.isChosen);
  if (!chosen) return <Tiles segment={segment} choices={choices} />;
  if (choices.length === 1) {
    return (
      <div className={CHOSEN_ROW}>
        <input type="hidden" name={segment} value={chosen.id} />
        <TileFace choice={chosen} />
        <span className={`${ROW_PILL} text-text-tertiary`}>{t("ask.build.only")}</span>
      </div>
    );
  }
  return (
    <BuilderFold
      key={chosen.id}
      segment={segment}
      summaryLabel={`${label}: ${chosen.label}. ${t("ask.build.change")}`}
      summary={
        <>
          <TileFace choice={chosen} />
          <span className={`${ROW_PILL} text-text-primary group-hover/sum:bg-bg-hover`}>
            {t("ask.build.change")}
            <span className="duration-fast transition-transform group-open/fold:rotate-180">
              <Icon name="caret-down" size="sm" />
            </span>
          </span>
        </>
      }
    >
      <p className="text-label-m text-text-secondary m-0 mb-2 font-semibold">
        {t("ask.build.others", { n: choices.length })}
      </p>
      <Tiles segment={segment} choices={choices} />
    </BuilderFold>
  );
}
