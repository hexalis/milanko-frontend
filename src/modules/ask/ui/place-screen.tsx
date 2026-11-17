import Link from "next/link";
import { tv } from "tailwind-variants";
import {
  changeLabel,
  EvidenceMeter,
  formatCoordinates,
  formatFigure,
  formatOdds,
  rateLabel,
  SeriesChart,
  strengthWord,
  trendDirection,
  TrendReadout,
  unitLabel,
  verdictOf,
  VerdictStamp,
  type TrendCase,
} from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { Notice } from "@/shared/ui/notice";
import { ScrollRegion } from "@/shared/ui/scroll-region";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import {
  isAgainstPlanet,
  LIVE_TREND_VARIABLES,
  placeHref,
  type LiveVariable,
  type PlacePoint,
} from "../domain/place";

/*
 * "Your place" (POC renderPlace): the trend of one NASA POWER variable at a point the reader chose,
 * tested like a case file and said to be what it is, computed now and reviewed by nobody. The
 * variable can be switched; the other POC sections (heat days, the last 90 days, the orbit image
 * and nearby events) are not ported in this pilot.
 */

/** What the page could read for this point and variable. */
export type PlaceResult =
  | { status: "ok"; file: TrendCase }
  | { status: "too-short" }
  | { status: "failed" };

type PlaceScreenProps = {
  point: PlacePoint;
  variable: LiveVariable;
  result: PlaceResult;
  /** Quality flags the team documented for this area (facts.json cautions). */
  cautions: string[];
  planet: { perDecade: number; points: number };
  translator: Translator;
};

const CARD = "rounded-card bg-bg-surface shadow-card medium:p-6 p-5";

const answerCard = tv({
  base: `${CARD} border-s-[6px]`,
  variants: {
    verdict: { confirmed: "border-status-ok", inconclusive: "border-trend-neutral" },
  },
});

const rateInk = tv({
  base: "font-display text-[clamp(30px,4vw,42px)] leading-none font-semibold tracking-tight tabular-nums",
  variants: {
    direction: { up: "text-trend-up", down: "text-trend-down", flat: "text-trend-neutral" },
  },
});

const PILL = [
  "inline-flex min-h-9 items-center rounded-full border border-border-subtle bg-bg-surface px-3.5",
  "text-label-m font-semibold text-text-primary no-underline transition-colors duration-fast hover:bg-bg-hover",
  "aria-[current=page]:border-action-primary aria-[current=page]:bg-action-selected aria-[current=page]:text-text-brand",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

function placeTitle(point: PlacePoint) {
  return point.name ?? formatCoordinates(point.lat, point.lon);
}

function Head({ point, translator }: Pick<PlaceScreenProps, "point" | "translator">) {
  const { t } = translator;
  return (
    <header className="flex flex-col gap-3">
      <nav aria-label={t("nav.breadcrumb")} className="text-label-m text-text-secondary">
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
          <li>
            <Link
              href="/ask"
              className="hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
            >
              <Icon name="arrow-left" size="sm" />
              {t("nav.ask")}
            </Link>
          </li>
          <li aria-hidden="true">
            <Icon name="caret-right" size="sm" />
          </li>
          <li className="text-text-primary" aria-current="page">
            {t("place.crumb")}
          </li>
        </ol>
      </nav>
      <p className="text-overline text-text-tertiary m-0">{t("place.meta")}</p>
      <h1 className="text-heading-h1 font-display text-text-primary m-0 font-semibold text-balance">
        {placeTitle(point)}
      </h1>
      <ul className="text-label-m text-text-secondary m-0 flex list-none flex-wrap gap-2 p-0">
        <li className="border-border-subtle inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
          <Icon name="map-pin" size="sm" />
          <span className="tabular-nums">{formatCoordinates(point.lat, point.lon)}</span>
        </li>
        <li className="border-border-subtle inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
          <Icon name="satellite" size="sm" />
          NASA POWER · MERRA-2
        </li>
        <li className="border-border-subtle text-text-primary inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1">
          <Icon name="info" size="sm" />
          {t("place.unreviewed")}
        </li>
      </ul>
    </header>
  );
}

function VariableSwitch({
  point,
  variable,
  translator,
}: Pick<PlaceScreenProps, "point" | "variable" | "translator">) {
  const { t } = translator;
  return (
    <nav aria-label={t("place.variable")} className="flex flex-col gap-2">
      <p className="text-label-m text-text-secondary m-0 font-semibold">{t("place.variable")}</p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {LIVE_TREND_VARIABLES.map((option) => (
          <li key={option}>
            <Link
              href={placeHref(point, option)}
              scroll={false}
              aria-current={option === variable ? "page" : undefined}
              className={PILL}
            >
              {t(`var.${option}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Answer({
  file,
  point,
  planet,
  translator,
}: { file: TrendCase } & Pick<PlaceScreenProps, "point" | "planet" | "translator">) {
  const { t } = translator;
  const verdict = verdictOf(file);
  const direction = trendDirection(file.t);
  const from = file.series[0]?.[0] ?? 0;
  const to = file.series.at(-1)?.[0] ?? 0;
  const claim = t(file.t.significant ? "place.claim" : "place.claim.flat", {
    v: t(`var.${file.variable}`),
    place: placeTitle(point),
    total: changeLabel(file, { translator }),
    from,
  });
  return (
    <section aria-labelledby="place-answer" className={answerCard({ verdict })}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerdictStamp verdict={verdict} label={t(`verdict.${verdict}`)} />
        <EvidenceMeter
          strength={file.t.strength}
          word={strengthWord(file, { translator })}
          isWordHidden={false}
        />
      </div>
      <h2
        id="place-answer"
        className="text-heading-h3 font-display text-text-primary mt-4 mb-0 font-semibold text-balance"
      >
        {claim}
      </h2>
      <p className="mt-4 mb-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={rateInk({ direction })}>{rateLabel(file, { translator })}</span>
        <span className="text-body-m text-text-secondary">{t("perDecade")}</span>
      </p>
      <p className="text-body-m text-text-secondary mt-3 mb-0 max-w-[60ch]">
        {t("case.chance", { odds: formatOdds(file.t.p, translator) })}
      </p>
      {file.variable === "T2M" ? (
        <p className="text-body-m font-reading text-text-primary mt-3 mb-0 max-w-[60ch]">
          {t("place.lead", {
            rate: formatFigure(file.t.perDecade, 2, true),
            from,
            to,
            global: formatFigure(planet.perDecade, 2, true),
            points: planet.points,
          })}
        </p>
      ) : null}
      {isAgainstPlanet(file, planet.perDecade) ? (
        <div className="mt-4">
          <Notice>{t("place.against")}</Notice>
        </div>
      ) : null}
    </section>
  );
}

function Evidence({ file, translator }: { file: TrendCase; translator: Translator }) {
  const { t, locale } = translator;
  const direction = trendDirection(file.t);
  const unit = unitLabel(file.unit, locale);
  const from = file.series[0]?.[0] ?? 0;
  const to = file.series.at(-1)?.[0] ?? 0;
  const variableName = t(`var.${file.variable}`);
  const sub = t(unit ? "chart.place.sub" : "chart.place.sub.index", {
    v: variableName,
    unit,
    from,
    to,
    n: file.series.length,
  });
  return (
    <section aria-labelledby="place-data" className="flex flex-col gap-2.5">
      <h2
        id="place-data"
        className="text-heading-h3 font-display text-text-primary m-0 font-semibold"
      >
        {t("cf.s.data")}
      </h2>
      <div className={CARD}>
        <p className="text-body-m text-text-secondary m-0">{sub}</p>
        <p className="text-body-l font-reading text-text-primary mt-1 mb-0 max-w-[60ch]">
          {t("chart.place.purpose")}
        </p>
        <div className="mt-3">
          <SeriesChart
            data={file.series}
            trend={file.t}
            digits={file.digits}
            unit={unit}
            direction={direction}
            label={`${variableName} · ${sub}`}
            recordLabel={t(direction === "down" ? "chart.min" : "chart.max")}
            inline={{
              series: t("case.chart.inline.series"),
              trend: t("case.chart.inline.trend"),
              band: t("case.chart.inline.band"),
            }}
          />
        </div>
        <p className="text-body-s text-text-secondary mt-2 mb-0">{t("place.caption")}</p>
        <details className="mt-3">
          <summary className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring min-h-8 cursor-pointer rounded-xs">
            {t("cf.table")}
          </summary>
          <ScrollRegion className="mt-2 max-h-[300px] overflow-auto" label={t("cf.table")}>
            <Table
              caption={sub}
              head={[
                <Th key="year">{t("tbl.year")}</Th>,
                <Th key="value">{unit ? `${variableName} (${unit})` : variableName}</Th>,
                <Th key="trend">{t("case.chart.inline.trend")}</Th>,
              ]}
            >
              {file.series.map(([year, value]) => (
                <Tr key={year}>
                  <Td>
                    <span className="tabular-nums">{year}</span>
                  </Td>
                  <Td>
                    <span className="tabular-nums">{formatFigure(value, file.digits + 1)}</span>
                  </Td>
                  <Td>
                    <span className="tabular-nums">
                      {formatFigure(file.t.intercept + file.t.slope * year, file.digits + 1)}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Table>
          </ScrollRegion>
        </details>
      </div>
    </section>
  );
}

function HowSure({ file, translator }: { file: TrendCase; translator: Translator }) {
  return (
    <section aria-labelledby="place-sure" className="flex flex-col gap-2.5">
      <h2
        id="place-sure"
        className="text-heading-h3 font-display text-text-primary m-0 font-semibold"
      >
        {translator.t("cf.s.sure")}
      </h2>
      <div className={CARD}>
        <TrendReadout file={file} translator={translator} />
      </div>
    </section>
  );
}

function Limits({ point, translator }: Pick<PlaceScreenProps, "point" | "translator">) {
  const { t } = translator;
  return (
    <section aria-labelledby="place-limits" className="flex flex-col gap-2.5">
      <h2
        id="place-limits"
        className="text-heading-h3 font-display text-text-primary m-0 font-semibold"
      >
        {t("case.limits")}
      </h2>
      <div className="rounded-card border-border-strong medium:p-6 flex flex-col gap-4 border border-dashed p-5">
        <p className="text-body-m text-text-secondary m-0 max-w-[70ch]">{t("place.limits.live")}</p>
        <p className="text-body-m text-text-secondary m-0 max-w-[70ch]">{t("ask.place.cell")}</p>
        <p className="m-0 flex flex-wrap gap-3">
          <Link
            href={`/explore?lat=${point.lat.toFixed(2)}&lon=${point.lon.toFixed(2)}`}
            className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
          >
            <Icon name="explore" size="sm" />
            {t("case.globe")}
          </Link>
          <Link
            href="/ask"
            className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
          >
            <Icon name="search" size="sm" />
            {t("place.another")}
          </Link>
        </p>
      </div>
    </section>
  );
}

function Unavailable({
  result,
  point,
  variable,
  translator,
}: { result: Exclude<PlaceResult, { status: "ok" }> } & Pick<
  PlaceScreenProps,
  "point" | "variable" | "translator"
>) {
  const { t } = translator;
  if (result.status === "too-short") return <Notice>{t("exp.nodata")}</Notice>;
  return (
    <div className="flex flex-col items-start gap-3">
      <Notice tone="error">{t("place.failed")}</Notice>
      <Link
        href={placeHref(point, variable)}
        className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
      >
        {t("place.retry")}
        <Icon name="arrow-right" size="sm" />
      </Link>
    </div>
  );
}

export function PlaceScreen(props: PlaceScreenProps) {
  const { point, variable, result, cautions, planet, translator } = props;
  const { t } = translator;
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pt-6 pb-16">
      <article className="flex max-w-[1080px] flex-col gap-8">
        <Head point={point} translator={translator} />
        {cautions.map((id) => (
          <Notice key={id} tone="error">
            <strong>{t("ask.caution.t")}</strong> {t(`ask.caution.${id}`)}
          </Notice>
        ))}
        <VariableSwitch point={point} variable={variable} translator={translator} />
        {result.status === "ok" ? (
          <>
            <Answer file={result.file} point={point} planet={planet} translator={translator} />
            <Evidence file={result.file} translator={translator} />
            <HowSure file={result.file} translator={translator} />
          </>
        ) : (
          <Unavailable result={result} point={point} variable={variable} translator={translator} />
        )}
        <Limits point={point} translator={translator} />
      </article>
    </main>
  );
}
