import type { ReactNode } from "react";
import { fileName, formatCoordinates, formatDate, trendText, unitLabel } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { GRID_CELL, unitText } from "../domain/guided";
import { StepLead, type StepProps } from "./guided-parts";

/*
 * Screen "look" · place and clues on one card (POC ask.js renderAsk, sk === "look"): one fact per
 * line, a short answer to read at a glance, a quieter line under it, and the technical detail only
 * at the scientific level.
 */

type FactProps = { icon: string; label: string; value: string; note?: string; science?: ReactNode };

function Fact({ icon, label, value, note, science }: FactProps) {
  return (
    <li className="border-border-subtle medium:grid-cols-[2.5rem_minmax(0,1fr)] medium:gap-3.5 medium:py-4 grid grid-cols-[2.125rem_minmax(0,1fr)] items-start gap-3 py-3.5 not-first:border-t">
      <span className="bg-bg-surface-sunken text-text-brand medium:size-10 grid size-[34px] place-items-center rounded-xl text-[20px]">
        <Icon name={icon} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-label-s text-text-secondary font-semibold">{label}</p>
        <p className="medium:text-[18px] text-text-primary text-[17px] leading-snug font-semibold">
          {value}
        </p>
        {note ? <p className="text-body-s text-text-secondary max-w-[52ch]">{note}</p> : null}
        {science ? (
          <p className="text-text-secondary mt-1 font-mono text-[12.5px] [overflow-wrap:anywhere]">
            {science}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function ScreenLook({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { question, file, depth } = view;
  const context = { translator, catalog };
  const place = fileName(file, context);
  const science = (text: ReactNode) => (depth === "science" ? text : undefined);
  const hasUnit = Boolean(unitLabel(file.unit, locale));
  const from = file.series[0]?.[0];
  const to = file.series.at(-1)?.[0];
  const built = catalog.generated
    ? `${t("ask.sci.built")} ${formatDate(catalog.generated, locale)}`
    : undefined;
  return (
    <>
      <StepLead>
        {question.published ? t(`ask.place.why.${question.id}`) : t("ask.place.why", { place })}
      </StepLead>
      <ul
        data-tour="look-facts"
        className="rounded-card bg-bg-surface shadow-card medium:px-5 max-w-[640px] border border-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] px-3.5 py-0.5"
      >
        <Fact
          icon="map-pin"
          label={t("prop.place")}
          value={place}
          note={trendText(file, "region", context)}
          science={science(`${GRID_CELL} · ${formatCoordinates(file.lat, file.lon)}`)}
        />
        <Fact
          icon={question.theme}
          label={t("ask.clue.var")}
          value={`${t(`var.${file.variable}`)}${hasUnit ? ` (${unitText(file.unit, locale)})` : ""}`}
          note={t(`ask.var.${file.variable}.d`)}
          science={science(file.variable)}
        />
        <Fact
          icon="chart"
          label={t("ask.clue.agg")}
          value={t("ask.fact.agg")}
          note={t("ask.fact.agg.d")}
          science={science(trendText(file, "metric", context))}
        />
        <Fact
          icon="calendar"
          label={t("ask.clue.period")}
          value={`${from}–${to}`}
          note={t("ask.fact.years", { n: file.series.length })}
          science={science(built)}
        />
        <Fact
          icon="satellite"
          label={t("ask.clue.source")}
          value="NASA POWER"
          note={t("ask.fact.src.d")}
          science={science("MERRA-2 · power.larc.nasa.gov")}
        />
      </ul>
      {/*
       * Deferred (POC orbitBlock): the place seen from orbit (NASA GIBS true colour) beside the
       * facts. GIBS is not ported yet, so the note on the grid cell stands alone under the card.
       */}
      <p
        data-tour="look-cell"
        className="text-body-s text-text-secondary grid max-w-[640px] grid-cols-[1.25rem_minmax(0,1fr)] gap-2.5 px-1"
      >
        <span className="text-text-brand mt-0.5">
          <Icon name="info-on" />
        </span>
        <span>
          <strong className="text-text-primary">{t("ask.place.cell.t")}</strong>{" "}
          {t("ask.place.cell")}
        </span>
      </p>
    </>
  );
}
