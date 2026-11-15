import Link from "next/link";
import type { Ref } from "react";
import { eventTitle, formatCoordinates, formatDate } from "@/modules/cases";
import type { Locale } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { categoryName, type ExploreT } from "../domain/explore-copy";
import type { GlobeTile, TilePeriod } from "../domain/globe-messages";
import type { SectorId } from "../domain/sectors";
import { Actions, PanelHead, PRIMARY_LINK, SECONDARY_BUTTON } from "./drawer-parts";

const MAX_TILE_CATEGORIES = 4;

type PointPanelProps = {
  lat: number;
  lon: number;
  sector: SectorId | null;
  /** Case files in that sector. */
  sectorFileCount: number;
  /** The tile the globe lifted here, once it has counted its events. */
  tile: GlobeTile | null;
  locale: Locale;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
  onSector: (id: SectorId) => void;
};

function periodText(period: TilePeriod, t: ExploreT): string {
  if (period.kind === "live") return t("w3.period.live");
  if (period.kind === "year") return t("w3.period.year", { y: period.y });
  return t("w3.period.all", { from: period.from, to: period.to });
}

/** The globe's count of EONET events in the lifted hexagon (the POC's tileBlock). */
function TileEvents({ tile, locale, t }: { tile: GlobeTile; locale: Locale; t: ExploreT }) {
  const period = periodText(tile.period, t);
  return (
    <section aria-labelledby="point-tile" className="flex flex-col gap-2">
      <h3 id="point-tile" className="text-label-l text-text-primary flex items-center gap-1.5">
        <Icon name="globe-pin" />
        {t("pt.tile")}
      </h3>
      {tile.n === 0 ? (
        <p className="text-body-s text-text-secondary">{t("pt.tile.none", { period })}</p>
      ) : (
        <>
          <p className="text-body-s text-text-secondary">
            {t("pt.tile.d", { km: tile.km, period })}
          </p>
          <ul className="flex flex-col gap-1">
            {tile.cats.slice(0, MAX_TILE_CATEGORIES).map(([category, count]) => (
              <li key={category} className="text-body-m flex justify-between gap-3">
                <span>{categoryName(t, category)}</span>
                <span className="tabular-nums">{count.toLocaleString(locale)}</span>
              </li>
            ))}
          </ul>
          {tile.latest ? (
            <p className="text-body-s text-text-secondary">
              {t("w3.tile.latest", {
                title: eventTitle(tile.latest.title.replace(/\s\d{6,}$/, ""), locale),
                date: formatDate(tile.latest.date, locale),
              })}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * Any point of the planet (the POC's pointPanel), reduced to where it is and the persisted region
 * explorer. Deferred, because they read external services live: the NASA POWER test at the point
 * (investigate, pointExtras: trend, heat days, last 90 days), the GIBS orbit image, the nearby EONET
 * events list, and the non-NASA context (Open-Meteo air quality, GBIF fauna, World Bank indicators).
 */
export function PointPanel({
  lat,
  lon,
  sector,
  sectorFileCount,
  tile,
  locale,
  t,
  titleRef,
  onSector,
}: PointPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon="globe-pin"
        kind={t("exp.yours")}
        title={t("exp.point", { coords: formatCoordinates(lat, lon) })}
        titleRef={titleRef}
      />
      <p className="text-body-s text-text-secondary">
        {sector ? (
          <button type="button" className={SECONDARY_BUTTON} onClick={() => onSector(sector)}>
            <Icon name="map-pin" />
            {t(`reg.${sector}`)} ·{" "}
            {sectorFileCount === 1
              ? t("exp.sector.one")
              : t("exp.sector.files", { n: sectorFileCount })}
          </button>
        ) : (
          t("reg.ocean")
        )}
      </p>
      <Actions>
        <Link href="/regions" className={PRIMARY_LINK}>
          <Icon name="chart" />
          {t("exp.point.regions")}
          <Icon name="arrow-right" />
        </Link>
      </Actions>
      {tile ? <TileEvents tile={tile} locale={locale} t={t} /> : null}
    </div>
  );
}
