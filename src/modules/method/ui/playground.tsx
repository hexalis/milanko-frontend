"use client";

import { Button } from "@hexalis/design-system";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  EvidenceMeter,
  formatFigure,
  formatOdds,
  formatP,
  SeriesChart,
  VerdictStamp,
  type Point,
} from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { useLabDemo, type DemoMove } from "../hooks/use-lab-demo";
import { INITIAL_SEED, nextSeed } from "../domain/noise-lab";
import {
  editSeries,
  initialEdit,
  isUnchanged,
  playgroundLimits,
  readSeries,
  type PlaygroundEdit,
  type PlaygroundLimits,
  type PlaygroundStart,
  type SeriesReading,
} from "../domain/playground";
import { labTranslator, type LabCopy } from "./lab-copy";
import { DemoBar, DemoPointer } from "./lab-demo";
import { LabSlider } from "./noise-lab";

/*
 * The data playground: the reader picks one of the real yearly series of the case files, starts
 * from it (or from an invented series like it), changes its parts and reads the measured record
 * and their version side by side, judged by the same test. The measured line stays on the chart,
 * dotted, so every change shows against what NASA measured.
 */

export type PlaygroundSeries = {
  id: string;
  code: string;
  /** "Svalbard", "Central Chile"… */
  place: string;
  /** "Air temperature"… */
  variable: string;
  /** In the reader's language; empty for a 0–1 share. */
  unit: string;
  /** The raw unit of the data ("0–1", "NDVI", "mm/day"…), which bounds the values. */
  rawUnit: string;
  digits: number;
  href: string;
  series: Point[];
};

type PlaygroundProps = { copy: LabCopy; series: readonly PlaygroundSeries[] };

/** Sliders in DOM order, so the demo can find and move them. */
const SLIDER_KEYS = [
  "trend",
  "noise",
  "years",
  "spikeSize",
  "spikeYear",
] as const satisfies readonly (keyof PlaygroundEdit)[];

type SliderKey = (typeof SLIDER_KEYS)[number];

const snap = ({ min, max, step }: PlaygroundLimits[SliderKey], value: number) => {
  const stepped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
};

/*
 * The demo, on the first series: tripled noise only weakens the evidence; a short record loses
 * the trend; back to the measured data; an invented series has no trend, until one is added.
 */
function demoMoves(limits: PlaygroundLimits): DemoMove[] {
  return [
    { slider: 1, to: limits.noise.max, ms: 1200 },
    { slider: 2, to: Math.max(limits.years.min, 15), ms: 1100 },
    { press: '[data-demo="reset"]' },
    { press: '[data-demo="start-invented"]' },
    { slider: 0, to: snap(limits.trend, limits.trend.max / 4), ms: 1100 },
  ];
}

/* The radio's dot, drawn beside the hidden input (peer) at the card's corner. */
const DOT =
  "border-border-strong peer-checked:border-border-selected peer-checked:bg-border-selected absolute end-3 top-3.5 size-4 rounded-full border-2 peer-checked:shadow-[inset_0_0_0_3px_var(--color-bg-surface)]";

const CHOICE =
  "rounded-control border-border-subtle bg-bg-surface has-checked:border-border-selected has-checked:ring-border-selected has-checked:ring-1 has-checked:ring-inset has-focus-visible:outline-focus-ring duration-fast hover:border-border-strong relative grid cursor-pointer gap-0.5 border p-3 pe-10 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2";

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    // overflow-x-clip: the slider's hidden input follows its thumb, past the edge at 100 %.
    <fieldset className="m-0 -mx-1 grid min-w-0 gap-3 overflow-x-clip border-0 px-1 py-0">
      <legend className="text-label-l text-text-primary mb-3 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-body-s text-text-tertiary -mt-1">{children}</p>;
}

type CardProps = {
  title: string;
  reading: SeriesReading;
  pick: PlaygroundSeries;
  translator: Translator;
  isYours?: boolean;
};

function ReadingCard({ title, reading, pick, translator, isYours = false }: CardProps) {
  const { t } = translator;
  const { trend } = reading;
  const unit = pick.unit ? ` ${pick.unit}` : "";
  return (
    <section
      aria-label={title}
      className={`rounded-card grid content-start gap-2 border p-4 ${isYours ? "border-border-strong bg-bg-surface shadow-card" : "border-border-subtle bg-bg-surface-sunken"}`}
    >
      <h3 className="text-label-m text-text-secondary flex items-center gap-2 font-semibold">
        <span
          aria-hidden="true"
          className={`inline-block w-5 border-t-2 ${isYours ? "border-chart-1" : "border-text-tertiary border-dotted"}`}
        />
        {title}
      </h3>
      {trend ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <VerdictStamp verdict={reading.verdict} label={t(`verdict.${reading.verdict}`)} />
            <EvidenceMeter strength={trend.strength} word={t(`strength.${trend.strength}`)} />
          </div>
          <dl className="text-body-s grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="text-text-secondary">Sen</dt>
            <dd className="text-text-primary m-0 font-mono">
              {`${formatFigure(trend.perDecade, pick.digits, true)}${unit} / 10`}
            </dd>
            <dt className="text-text-secondary">{t("pg.row.change")}</dt>
            <dd className="text-text-primary m-0 font-mono">
              {`${formatFigure(trend.total, pick.digits, true)}${unit}`}
            </dd>
            <dt className="text-text-secondary">p</dt>
            <dd className="text-text-primary m-0 font-mono">{formatP(trend.p)}</dd>
            <dt className="text-text-secondary">{t("pg.row.years")}</dt>
            <dd className="text-text-primary m-0 font-mono">{trend.n}</dd>
          </dl>
          <p className="text-body-s text-text-secondary">
            {t("case.chance", { odds: formatOdds(trend.p, translator) })}
          </p>
        </>
      ) : null}
    </section>
  );
}

/** What the reader's changes did to the verdict and the trend, in a sentence. */
function changeText(
  translator: Translator,
  pick: PlaygroundSeries,
  measured: SeriesReading,
  yours: SeriesReading,
  isSame: boolean,
): string {
  const { t } = translator;
  if (isSame || !measured.trend || !yours.trend) return t("pg.change.none");
  const verdict =
    measured.verdict === yours.verdict
      ? t("pg.change.same", { verdict: t(`verdict.${yours.verdict}`) })
      : t("pg.change.flip", {
          from: t(`verdict.${measured.verdict}`),
          to: t(`verdict.${yours.verdict}`),
        });
  const rate = t("pg.change.rate", {
    from: formatFigure(measured.trend.perDecade, pick.digits, true),
    to: formatFigure(yours.trend.perDecade, pick.digits, true),
    unit: pick.unit,
  });
  return `${verdict} ${rate.replace(/\s+/g, " ")}`;
}

export function Playground({ copy, series }: PlaygroundProps) {
  const translator = useMemo(() => labTranslator(copy), [copy]);
  const { t } = translator;
  const [pickId, setPickId] = useState(series[0]?.id ?? "");
  const pick = series.find((option) => option.id === pickId) ?? series[0];
  const [edit, setEdit] = useState<PlaygroundEdit>(() =>
    initialEdit(pick?.series ?? [], INITIAL_SEED),
  );
  const limits = useMemo(() => playgroundLimits(pick?.series ?? []), [pick]);
  const measured = useMemo(() => readSeries(pick?.series ?? []), [pick]);
  const yours = useMemo(
    () => readSeries(pick ? editSeries(pick.series, edit, pick.rawUnit) : []),
    [pick, edit],
  );
  const lastYear = pick?.series.at(-1)?.[0] ?? 0;

  const rootRef = useRef<HTMLDivElement>(null);
  // The demo reads where a slider stands now, between renders.
  const live = useRef({ edit, limits, lastYear });
  useEffect(() => {
    live.current = { edit, limits, lastYear };
  });
  // Planned once, on the first series: picking another must not start the demo again.
  const [moves] = useState(() => demoMoves(playgroundLimits(series[0]?.series ?? [])));
  const read = useCallback(
    (slider: number) => live.current.edit[SLIDER_KEYS[slider] ?? "trend"],
    [],
  );
  const write = useCallback((slider: number, value: number) => {
    const key = SLIDER_KEYS[slider] ?? "trend";
    const next = snap(live.current.limits[key], value);
    setEdit((current) =>
      key === "years"
        ? {
            ...current,
            years: next,
            spikeYear: Math.max(current.spikeYear, live.current.lastYear - next + 1),
          }
        : { ...current, [key]: next },
    );
  }, []);
  const demo = useLabDemo(rootRef, moves, read, write, 0.2);
  if (!pick) return null;

  const isSame = isUnchanged(edit, pick.series);
  const firstShown = lastYear - edit.years + 1;
  const unit = pick.unit ? ` ${pick.unit}` : "";
  const set = (key: keyof PlaygroundEdit) => (value: number) =>
    setEdit((current) => ({ ...current, [key]: value }));

  function choose(id: string) {
    const next = series.find((option) => option.id === id);
    if (!next) return;
    setPickId(id);
    setEdit((current) => ({ ...initialEdit(next.series, current.seed), start: current.start }));
  }

  function setYears(years: number) {
    // The extreme year stays inside the years kept.
    setEdit((current) => ({
      ...current,
      years,
      spikeYear: Math.max(current.spikeYear, lastYear - years + 1),
    }));
  }

  return (
    <div
      ref={rootRef}
      className="expanded:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] relative grid gap-x-8 gap-y-4"
    >
      {demo.cursor ? <DemoPointer cursor={demo.cursor} /> : null}
      <div className="expanded:col-span-2">
        <DemoBar
          isTurn={demo.isTurn}
          onReplay={demo.replay}
          turn={t("method.demo.turn")}
          replay={t("method.demo.replay")}
        />
      </div>
      <div className="grid content-start gap-8">
        {/* Phones: the verdict of the reader's version rides along while the controls scroll. */}
        <div
          aria-hidden="true"
          className="expanded:hidden border-border-subtle bg-bg-surface/95 shadow-raised sticky top-[calc(var(--shell-top)+0.5rem)] z-10 flex flex-wrap items-center gap-2 rounded-full border px-3 py-2 backdrop-blur-md"
        >
          <span className="text-label-s text-text-secondary font-semibold">{t("pg.yours")}</span>
          <VerdictStamp verdict={yours.verdict} label={t(`verdict.${yours.verdict}`)} />
          {yours.trend ? (
            <span className="text-label-s text-text-primary font-mono">
              {`${formatFigure(yours.trend.perDecade, pick.digits, true)}${unit} / 10`}
            </span>
          ) : null}
        </div>
        <Step title={t("pg.pick")}>
          <div className="medium:grid-cols-2 expanded:grid-cols-1 grid gap-2">
            {series.map((option) => (
              <label key={option.id} className={CHOICE}>
                <input
                  type="radio"
                  name="pg-series"
                  value={option.id}
                  checked={option.id === pick.id}
                  onChange={() => choose(option.id)}
                  className="peer sr-only"
                />
                <span aria-hidden="true" className={DOT} />
                <span className="text-body-m-strong text-text-primary">{option.variable}</span>
                <span className="text-body-s text-text-secondary">
                  {option.place} · <span className="font-mono">{option.code}</span>
                </span>
              </label>
            ))}
          </div>
        </Step>
        <Step title={t("pg.start")}>
          <div className="grid grid-cols-2 gap-2">
            {(["measured", "invented"] as const satisfies readonly PlaygroundStart[]).map(
              (start) => (
                <label key={start} className={CHOICE} data-demo={`start-${start}`}>
                  <input
                    type="radio"
                    name="pg-start"
                    value={start}
                    checked={edit.start === start}
                    onChange={() => setEdit((current) => ({ ...current, start }))}
                    className="peer sr-only"
                  />
                  <span aria-hidden="true" className={DOT} />
                  <span className="text-body-m-strong text-text-primary">
                    {t(`pg.start.${start}`)}
                  </span>
                  <span className="text-body-s text-text-secondary">
                    {t(`pg.start.${start}.d`)}
                  </span>
                </label>
              ),
            )}
          </div>
          {edit.start === "invented" ? (
            <Button
              intent="secondary"
              onPress={() => setEdit((current) => ({ ...current, seed: nextSeed(current.seed) }))}
            >
              <Icon name="shuffle" />
              {t("method.play.shuffle")}
            </Button>
          ) : null}
        </Step>
        <Step title={t("pg.edit")}>
          <LabSlider
            label={t("pg.trend")}
            output={`${formatFigure(edit.trend, pick.digits, true)}${unit} / 10`}
            value={edit.trend}
            limits={limits.trend}
            format={{ signDisplay: "exceptZero", maximumFractionDigits: pick.digits + 1 }}
            onChange={set("trend")}
          />
          <Hint>{t("pg.trend.d")}</Hint>
          <LabSlider
            label={t("pg.noise")}
            output={`× ${edit.noise.toFixed(1)}`}
            value={edit.noise}
            limits={limits.noise}
            format={{ minimumFractionDigits: 1 }}
            onChange={set("noise")}
          />
          <Hint>{t("pg.noise.d")}</Hint>
          <LabSlider
            label={t("pg.years")}
            output={`${firstShown}–${lastYear}`}
            value={edit.years}
            limits={limits.years}
            onChange={setYears}
          />
          <Hint>{t("pg.years.d")}</Hint>
          <LabSlider
            label={t("pg.spike")}
            output={`${formatFigure(edit.spikeSize, 1, true)} σ`}
            value={edit.spikeSize}
            limits={limits.spikeSize}
            format={{ signDisplay: "exceptZero", minimumFractionDigits: 1 }}
            onChange={set("spikeSize")}
          />
          <LabSlider
            label={t("pg.spike.year")}
            output={String(edit.spikeYear)}
            value={edit.spikeYear}
            limits={{ ...limits.spikeYear, min: Math.max(limits.spikeYear.min, firstShown) }}
            format={{ useGrouping: false }}
            onChange={set("spikeYear")}
          />
          <Hint>{t("pg.spike.d")}</Hint>
          <div data-demo="reset" className="grid">
            <Button
              intent="secondary"
              isDisabled={isSame}
              onPress={() => setEdit((current) => initialEdit(pick.series, current.seed))}
            >
              <Icon name="arrow-left" />
              {t("pg.reset")}
            </Button>
          </div>
        </Step>
      </div>
      <div className="expanded:sticky expanded:top-6 grid min-w-0 content-start gap-4 self-start">
        <p className="text-body-m text-text-primary font-reading" aria-live="polite">
          {changeText(translator, pick, measured, yours, isSame)}
        </p>
        <div className="rounded-card bg-bg-surface shadow-card grid gap-2 p-3">
          <SeriesChart
            data={yours.data}
            ghost={pick.series}
            trend={yours.trend}
            digits={pick.digits}
            unit={pick.unit}
            direction={yours.direction}
            label={t("pg.chart", { name: `${pick.variable} · ${pick.place}` })}
            inline={{ series: t("pg.legend.yours"), trend: t("case.chart.inline.trend") }}
          />
          <p className="text-body-s text-text-secondary flex flex-wrap gap-x-4 gap-y-1 px-2">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="border-chart-1 inline-block w-5 border-t-2" />
              {t("pg.legend.yours")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="border-text-tertiary inline-block w-5 border-t-2 border-dotted"
              />
              {t("pg.legend.measured")}
            </span>
          </p>
        </div>
        <div className="medium:grid-cols-2 grid gap-3">
          <ReadingCard
            title={t("pg.measured")}
            reading={measured}
            pick={pick}
            translator={translator}
          />
          <ReadingCard
            title={t("pg.yours")}
            reading={yours}
            pick={pick}
            translator={translator}
            isYours
          />
        </div>
        <Link
          href={pick.href}
          className="text-body-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex items-center gap-1.5 justify-self-start underline-offset-2 hover:underline"
        >
          {t("pg.open", { code: pick.code })}
          <Icon name="arrow-right" size="sm" />
        </Link>
      </div>
    </div>
  );
}
