import Link from "next/link";
import type { Ref } from "react";
import { formatDate } from "@/modules/cases";
import { formatNumber, formatSigned, withUnit } from "@/shared/lib/format";
import type { Locale } from "@/shared/lib/i18n";
import { toQueryString } from "@/shared/lib/search-params";
import { Icon } from "@/shared/ui/icon";
import type { ExploreT } from "../domain/explore-copy";
import type { RegionPlace, RegionReading } from "../domain/globe-messages";
import { directionOf, rarityOf, regionCode } from "../domain/region-reading";
import { Actions, Facts, PanelHead, PRIMARY_LINK } from "./drawer-parts";

/** "November 2026", for a month's mean. */
function formatMonth(iso: string, locale: Locale): string {
  return new Date(`${iso.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type RegionPanelProps = {
  code: number;
  place: RegionPlace;
  reading: RegionReading;
  locale: Locale;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
};

/**
 * A region of the globe's data layer: what the map shows there on that day, said in words, and the
 * way into the region's full record (/regions), which is not in the side menu.
 */
export function RegionPanel({ code, place, reading, locale, t, titleRef }: RegionPanelProps) {
  const { unit } = reading;
  const direction = directionOf(reading);
  const rarity = rarityOf(reading.z);
  // The record opens on this variable, ending on this day, named after the same place.
  const href = `/regions${toQueryString({ region: code, variable: reading.variable, end: reading.date, place: place ?? undefined })}`;
  const kind = place ? `${t("exp.reg.kind")} · ${t(`reg.${place}`)}` : t("exp.reg.kind");
  const difference = withUnit(formatSigned(reading.anomaly), unit);
  const lead =
    reading.period === "month"
      ? t("exp.reg.lead.month", {
          variable: reading.label,
          month: formatMonth(reading.date, locale),
        })
      : t("exp.reg.lead", { variable: reading.label, date: formatDate(reading.date, locale) });
  // Only the figures the layer has: a day's value comes without its normal.
  const facts = [
    reading.baseline === null
      ? null
      : { label: t("exp.reg.normal"), value: withUnit(formatNumber(reading.baseline), unit) },
    reading.anomaly === null ? null : { label: t("exp.reg.diff"), value: difference },
    rarity ? { label: t("exp.reg.rarity"), value: t(`exp.reg.r.${rarity}`) } : null,
    reading.source ? { label: t("exp.reg.source"), value: reading.source } : null,
  ].filter((fact) => fact !== null);

  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon="chart"
        kind={kind}
        title={t("exp.reg.title", { code: regionCode(code) })}
        titleRef={titleRef}
      />
      <p className="text-body-s text-text-secondary">{lead}</p>
      {reading.value === null && reading.anomaly === null ? (
        <p className="text-body-m text-text-primary">{t("exp.reg.none")}</p>
      ) : (
        <>
          <p className="text-heading-h4 font-display text-text-primary tabular-nums">
            {withUnit(formatNumber(reading.value), unit)}
            {direction ? (
              <span className="text-body-m text-text-secondary mt-1 block font-sans">
                {t(`exp.reg.${direction}`, { diff: difference })}
              </span>
            ) : null}
          </p>
          {facts.length ? <Facts facts={facts} /> : null}
          {reading.anomaly === null ? (
            <p className="text-body-s text-text-secondary">{t("exp.reg.hint")}</p>
          ) : null}
        </>
      )}
      <p className="text-body-s text-text-tertiary">{t("exp.reg.about")}</p>
      <Actions>
        <Link href={href} className={PRIMARY_LINK}>
          {t("exp.reg.open")}
          <Icon name="arrow-right" />
        </Link>
      </Actions>
    </div>
  );
}
