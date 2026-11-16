"use client";

import { Button, Slider } from "@hexalis/design-system";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EvidenceMeter,
  formatFigure,
  formatOdds,
  formatP,
  SeriesChart,
  VerdictStamp,
} from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { useLabDemo, type DemoMove } from "../hooks/use-lab-demo";
import {
  DEFAULT_PLANET,
  INITIAL_SEED,
  nextSeed,
  noiseDraws,
  PLANET_LIMITS,
  readPlanet,
  type PlanetSettings,
} from "../domain/noise-lab";
import { labTranslator, type LabCopy } from "./lab-copy";
import { DemoBar, DemoPointer } from "./lab-demo";

/*
 * "Try it: make your own planet" (POC renderMethod, L2700-2766): the reader sets a real trend, the
 * noise and the record length; the chart and the verdict follow. The first planet is always the
 * same seed, so the server and the browser draw it alike.
 */

type NoiseLabProps = {
  copy: LabCopy;
  /** The planet ends where the case data end. */
  lastYear: number;
};

const TREND_DIGITS = 2;

/** Sliders in DOM order, so the demo can find and move them. */
const SLIDER_KEYS = ["trend", "noise", "years"] as const satisfies readonly (keyof PlanetSettings)[];

/*
 * The demo: a strong real trend is found at once; then the year-to-year noise rises until the
 * same trend drowns and the test says it cannot tell; then the noise settles again.
 */
const DEMO: readonly DemoMove[] = [
  { slider: 0, to: 0.85, ms: 1100 },
  { slider: 1, to: 1.9, ms: 1400 },
  { slider: 1, to: 0.6, ms: 900 },
];

const snap = (key: keyof PlanetSettings, value: number) => {
  const { min, max, step } = PLANET_LIMITS[key];
  const stepped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
};

type LabSliderProps = {
  label: string;
  output: string;
  value: number;
  limits: { min: number; max: number; step: number };
  /** How assistive tech reads the value; the visible output carries the unit. */
  format?: Intl.NumberFormatOptions;
  onChange: (value: number) => void;
};

function LabSlider({ label, output, value, limits, format, onChange }: LabSliderProps) {
  return (
    <Slider
      value={value}
      minValue={limits.min}
      maxValue={limits.max}
      step={limits.step}
      formatOptions={format}
      onChange={onChange}
    >
      <Slider.Header>
        <Slider.Label>{label}</Slider.Label>
        <Slider.Output>{output}</Slider.Output>
      </Slider.Header>
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

export function NoiseLab({ copy, lastYear }: NoiseLabProps) {
  const translator = useMemo(() => labTranslator(copy), [copy]);
  const { t } = translator;
  const [settings, setSettings] = useState<PlanetSettings>(DEFAULT_PLANET);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const draws = useMemo(() => noiseDraws(seed), [seed]);
  const reading = useMemo(() => readPlanet(settings, draws, lastYear), [settings, draws, lastYear]);
  const { trend } = reading;
  const perDecade = t("unit.decade");

  const update = (key: keyof PlanetSettings) => (value: number) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const rootRef = useRef<HTMLDivElement>(null);
  // The demo reads where a slider stands now, between renders.
  const live = useRef(settings);
  useEffect(() => {
    live.current = settings;
  });
  const read = useCallback((slider: number) => live.current[SLIDER_KEYS[slider] ?? "trend"], []);
  const write = useCallback((slider: number, value: number) => {
    const key = SLIDER_KEYS[slider] ?? "trend";
    setSettings((current) => ({ ...current, [key]: snap(key, value) }));
  }, []);
  const demo = useLabDemo(rootRef, DEMO, read, write);

  return (
    <div
      ref={rootRef}
      className="expanded:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] relative grid gap-6"
    >
      {demo.cursor ? <DemoPointer cursor={demo.cursor} /> : null}
      <div className="flex flex-col gap-4">
        <DemoBar
          isTurn={demo.isTurn}
          onReplay={demo.replay}
          turn={t("method.demo.turn")}
          replay={t("method.demo.replay")}
        />
        <LabSlider
          label={t("method.play.trend")}
          output={`${formatFigure(settings.trend, TREND_DIGITS, true)} ${perDecade}`}
          value={settings.trend}
          limits={PLANET_LIMITS.trend}
          format={{ signDisplay: "exceptZero", minimumFractionDigits: TREND_DIGITS }}
          onChange={update("trend")}
        />
        <LabSlider
          label={t("method.play.noise")}
          output={`± ${settings.noise.toFixed(TREND_DIGITS)}`}
          value={settings.noise}
          limits={PLANET_LIMITS.noise}
          format={{ minimumFractionDigits: TREND_DIGITS }}
          onChange={update("noise")}
        />
        <LabSlider
          label={t("method.play.years")}
          output={String(settings.years)}
          value={settings.years}
          limits={PLANET_LIMITS.years}
          onChange={update("years")}
        />
        <Button intent="secondary" onPress={() => setSeed(nextSeed)}>
          <Icon name="shuffle" />
          {t("method.play.shuffle")}
        </Button>
        <div className="grid gap-2">
          {/* One short line is announced; the stamp, meter and figures below stay silent while sliding. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {trend ? `${t(`verdict.${reading.verdict}`)} · ${t(`strength.${trend.strength}`)}` : ""}
          </p>
          {trend ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <VerdictStamp verdict={reading.verdict} label={t(`verdict.${reading.verdict}`)} />
                <EvidenceMeter strength={trend.strength} word={t(`strength.${trend.strength}`)} />
              </div>
              <p className="text-body-s text-text-primary font-mono">
                {`p ${formatP(trend.p)} · Sen ${formatFigure(trend.perDecade, TREND_DIGITS, true)} ${perDecade}`}
              </p>
              <p className="text-body-s text-text-secondary">
                {t("case.chance", { odds: formatOdds(trend.p, translator) })}
              </p>
            </>
          ) : null}
        </div>
      </div>
      <div className="min-w-0">
        <SeriesChart
          data={reading.data}
          trend={trend}
          digits={TREND_DIGITS}
          unit=""
          direction={reading.direction}
          label={t("method.play.title")}
          inline={{
            series: t("case.chart.inline.series"),
            trend: t("case.chart.inline.trend"),
          }}
        />
      </div>
    </div>
  );
}
