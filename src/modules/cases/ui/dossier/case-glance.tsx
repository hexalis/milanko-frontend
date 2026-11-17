import { linkRecipe } from "@hexalis/components/themes";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { mapPosition, WORLD_MAP_URL, type CaseReading } from "../../domain/case-reading";
import { formatCoordinates, formatDate } from "../../domain/format";
import { PaperSheet } from "../case-paper";
import { EvidenceMeter } from "../evidence-meter";
import { Sparkline } from "../sparkline";
import { VerdictStamp } from "../verdict-stamp";
import { AnswerCard } from "./reading-answer";

/*
 * The screen a case file opens on: everything at once, before the long reading below.
 *  - The answer, with the verdict stamp pressed onto it.
 *  - Where: the NASA world map framed on the point, and the place seen from orbit.
 *  - The folder's sheets dealt out as paper (PaperSheet), one per level of evidence, the same
 *    pages the folder carried, each with its figure and what that figure means; a weaker file
 *    says why its other sheets are missing.
 *  - What is measured and why it matters to the people who live there.
 * The opening (case-glance.css) plays once as the page arrives and never under reduced motion.
 */

const TOTAL_SHEETS = 3;

const READ_LINK = `${linkRecipe({ variant: "inline" }).root()} inline-flex items-center gap-1.5 font-semibold hover:text-text-brand hover:decoration-2 focus-visible:focus-ring focus-visible:outline-focus-ring`;

/*
 * The map fills its card at any height: the world (2:1) covers the box and is framed on the
 * pin, clamped to the map's edges, using the box's own size (container units). The place from
 * orbit sits in the corner away from the pin, so it never hides it, and grows from that side.
 */
const MAP_WIDTH = "max(100cqw, 200cqh)";

function mapFrame(x: number, y: number): CSSProperties {
  return {
    width: MAP_WIDTH,
    left: `clamp(calc(100cqw - ${MAP_WIDTH}), calc(50cqw - ${x / 100} * ${MAP_WIDTH}), 0px)`,
    top: `clamp(calc(100cqh - ${MAP_WIDTH} / 2), calc(50cqh - ${y / 100} * ${MAP_WIDTH} / 2), 0px)`,
  };
}

/* A weaker file leaves the place of its missing sheets, and says there why they are missing. */
const MISSING_SPAN = ["", "medium:col-span-1", "medium:col-span-2"] as const;

type CaseGlanceProps = { reading: CaseReading; translator: Translator };

function WhereCard({ reading, translator }: CaseGlanceProps) {
  const { t, locale } = translator;
  const { place, globe } = reading.glance;
  const orbit = reading.data.orbit.at(-1);
  const pin = place ? mapPosition(place.lat, place.lon) : null;
  const isInsetLeft = (pin?.x ?? 0) >= 50;
  return (
    <figure className="cg-where rounded-card bg-bg-surface shadow-card flex flex-col overflow-hidden">
      <div className="bg-bg-surface-sunken medium:aspect-auto medium:min-h-[240px] medium:flex-1 [container-type:size] relative aspect-[2/1] overflow-hidden">
        <div className="absolute aspect-[2/1]" style={mapFrame(pin?.x ?? 50, pin?.y ?? 50)}>
          <Image
            src={WORLD_MAP_URL}
            alt={
              place ? t("cf.glance.map.alt", { place: place.label }) : t("cf.glance.map.planet.alt")
            }
            width={960}
            height={480}
            unoptimized
            priority
            className="cg-map absolute inset-0 size-full"
          />
          {pin ? (
            <span
              aria-hidden="true"
              className="cg-pin absolute size-0"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <span className="cg-ring absolute -start-4 -top-4 size-8 rounded-full border-2 border-white" />
              <span className="bg-action-primary absolute -start-[7px] -top-[7px] size-3.5 rounded-full border-2 border-white shadow-[0_1px_4px_rgb(0_0_0/0.5)]" />
            </span>
          ) : null}
        </div>
        {pin && orbit ? (
          <span
            className="cg-zoom absolute bottom-3 block aspect-square h-[min(64cqh,40cqw)] overflow-hidden rounded-[10px] border-2 border-white shadow-[0_6px_20px_rgb(0_0_0/0.45)]"
            style={
              {
                [isInsetLeft ? "left" : "right"]: "12px",
                "--cg-ox": isInsetLeft ? "100%" : "0%",
                "--cg-oy": "20%",
              } as CSSProperties
            }
          >
            <Image
              src={orbit.src}
              alt={orbit.alt}
              width={480}
              height={480}
              unoptimized
              className="size-full object-cover"
            />
            <span className="text-label-s absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-white tabular-nums">
              {t("cf.glance.zoom", { date: formatDate(orbit.date, locale) })}
            </span>
          </span>
        ) : null}
      </div>
      <figcaption className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 p-4">
        <div className="min-w-0">
          <p className="text-overline text-text-tertiary">{t("cf.glance.where")}</p>
          <p className="text-label-l text-text-primary">
            {place ? place.label : t("cf.chip.planet")}
          </p>
          <p className="text-body-s text-text-secondary tabular-nums">
            {place ? formatCoordinates(place.lat, place.lon) : t("cf.glance.planet")}
          </p>
        </div>
        <Link href={globe.href} className={buttonLink({ intent: "secondary" })}>
          <Icon name={globe.icon} />
          {globe.label}
        </Link>
      </figcaption>
    </figure>
  );
}

function Sheets({ reading, translator }: CaseGlanceProps) {
  const { t } = translator;
  const { sheets, spark, verdict, missing } = reading.glance;
  const { sure } = reading;
  const id = reading.path.slice(reading.path.lastIndexOf("/") + 1);
  return (
    <section aria-labelledby="cf-sheets" className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 id="cf-sheets" className="text-overline text-text-tertiary">
          {t("cf.glance.sheets")}
        </h3>
        <span className="text-label-m text-text-secondary tabular-nums">
          {t("cf.glance.sheets.n", { n: sheets.length })}
        </span>
        <span className="cg-meter ms-auto">
          <EvidenceMeter strength={sure.level} word={sure.word} />
        </span>
      </header>
      <ol className="medium:grid-cols-3 grid gap-3">
        {sheets.map((sheet, index) => (
          <li
            key={sheet.label}
            className="cg-sheet pp-shadow flex min-h-[300px]"
            style={{ "--i": index } as CSSProperties}
          >
            <PaperSheet
              sheet={sheet}
              index={index}
              count={sheets.length}
              code={reading.crumb.code}
              isInconclusive={verdict === "inconclusive"}
              translator={translator}
              chart={
                index === 0 && spark ? (
                  <Sparkline
                    id={`glance-${id}`}
                    series={spark.series}
                    trend={spark.trend}
                    direction={spark.direction}
                    isLastMarked={spark.isLastMarked}
                    isFilled
                  />
                ) : null
              }
            />
          </li>
        ))}
        {missing ? (
          <li
            className={`cg-slot border-border-strong flex flex-col justify-center gap-1 rounded-[14px] border border-dashed p-3.5 ${MISSING_SPAN[TOTAL_SHEETS - sheets.length] ?? ""}`}
          >
            <span className="text-overline text-text-tertiary">{t("cf.glance.missing")}</span>
            <span className="text-body-s text-text-secondary">{missing}</span>
          </li>
        ) : null}
      </ol>
      <p className="text-body-s text-text-secondary">{t("cf.glance.sheets.d")}</p>
    </section>
  );
}

export function CaseGlance({ reading, translator }: CaseGlanceProps) {
  const { t } = translator;
  const { glance } = reading;
  return (
    <section aria-labelledby="cf-glance" className="cg mt-3 flex flex-col gap-4">
      <h2 id="cf-glance" className="sr-only">
        {t("cf.glance.h")}
      </h2>
      <div className="medium:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] grid gap-4">
        <div className="cg-answer">
          <AnswerCard
            reading={reading}
            translator={translator}
            figureClass="cg-fig"
            stamp={
              <span className="cg-stamp inline-block -rotate-3" data-verdict={glance.verdict}>
                <VerdictStamp verdict={glance.verdict} label={glance.verdictLabel} />
              </span>
            }
          />
        </div>
        <WhereCard reading={reading} translator={translator} />
      </div>
      <Sheets reading={reading} translator={translator} />
      <div className="medium:grid-cols-2 grid gap-4">
        <div className="cg-note rounded-card bg-bg-surface shadow-card p-5">
          <h3 className="text-overline text-text-tertiary flex items-center gap-1.5">
            <Icon name="satellite" size="sm" />
            {t("cf.glance.what")}
          </h3>
          <p className="text-body-m font-reading text-text-primary mt-1.5">{reading.data.plain}</p>
        </div>
        <div className="cg-note rounded-card bg-bg-surface shadow-card p-5">
          <h3 className="text-overline text-text-tertiary flex items-center gap-1.5">
            <Icon name="map-pin" size="sm" />
            {t("cf.glance.impact")}
          </h3>
          <p className="text-body-m font-reading text-text-primary mt-1.5">{glance.impact}</p>
        </div>
      </div>
      <a href="#cf-data" className={`cg-note self-start ${READ_LINK}`}>
        {t("cf.glance.read")}
        <Icon name="caret-down" size="sm" />
      </a>
    </section>
  );
}
