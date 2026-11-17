import Link from "next/link";
import type { Ref } from "react";
import { eventTitle, formatCoordinates, formatDate } from "@/modules/cases";
import type { Locale } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import { categoryName, type ExploreT } from "../domain/explore-copy";
import type { GlobeEvent } from "../domain/globe-messages";
import { Actions, Facts, PanelHead, PRIMARY_LINK, SECONDARY_BUTTON } from "./drawer-parts";

/** GDACS titles end in their own record number ("Flood in Nigeria 1104186"). */
const RECORD_NUMBER = /\s\d{6,}$/;

const EVENT_FAMILY: Record<string, string> = {
  wildfires: "fire",
  severeStorms: "storm",
  dustHaze: "storm",
  floods: "water",
  drought: "water",
  waterColor: "water",
  seaLakeIce: "ice",
  snow: "ice",
  tempExtremes: "ice",
};

const EONET_EVENT = "https://eonet.gsfc.nasa.gov/api/v3/events/";

type EventPanelProps = {
  ev: GlobeEvent;
  /** EONET source names by id (data/events.json). */
  sources: Readonly<Record<string, string>>;
  locale: Locale;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
  onInvestigate: () => void;
};

/**
 * An EONET event in the drawer (the POC's eventPanel). Deferred: the catalog-audit badge, the GIBS
 * orbit image and the live NASA POWER "90 days before" (eventBefore), which read external services.
 */
export function EventPanel({ ev, sources, locale, t, titleRef, onInvestigate }: EventPanelProps) {
  const category = categoryName(t, ev.cat);
  const facts = [
    { label: t("event.date"), value: formatDate(ev.date, locale) },
    { label: t("event.source"), value: sources[ev.src] ?? (ev.src || "—") },
    {
      label: `${t("exp.lat")}/${t("exp.lon")}`,
      value: <span className="font-mono">{formatCoordinates(ev.lat, ev.lon)}</span>,
    },
    ...(ev.mag === null
      ? []
      : [{ label: t("event.magnitude"), value: `${ev.mag} ${ev.unit}`.trim() }]),
  ];
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon={`ev-${EVENT_FAMILY[ev.cat] ?? "earth"}`}
        kind={`${t("event.kind")} · ${category}`}
        title={eventTitle(ev.title.replace(RECORD_NUMBER, ""), locale) || category}
        titleRef={titleRef}
      />
      <Facts facts={facts} />
      <p className="text-body-m">
        <ExternalLink
          href={`${EONET_EVENT}${encodeURIComponent(ev.id)}`}
          newTabHint={t("link.newTab")}
        >
          {t("event.eonet")}
        </ExternalLink>
      </p>
      <Actions>
        <Link href={`/events/${encodeURIComponent(ev.id)}`} className={PRIMARY_LINK}>
          {t("event.record")}
          <Icon name="arrow-right" />
        </Link>
        <button type="button" className={SECONDARY_BUTTON} onClick={onInvestigate}>
          <Icon name="globe-pin" />
          {t("event.point")}
        </button>
      </Actions>
    </div>
  );
}
