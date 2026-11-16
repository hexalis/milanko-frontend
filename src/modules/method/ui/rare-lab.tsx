"use client";

import { Slider } from "@hexalis/design-system";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Field, Select } from "@/shared/ui/field";
import {
  DEFAULT_RARE,
  isRareBar,
  RARE_BARS,
  RARE_LIMITS,
  rareChance,
  type RareSettings,
} from "../domain/rare-lab";
import { useLabDemo, type DemoMove } from "../hooks/use-lab-demo";
import { labTranslator, type LabCopy } from "./lab-copy";
import { DemoBar, DemoPointer } from "./lab-demo";
import { RichText } from "./rich-text";

/*
 * "Try it: peak or record?" (POC renderMethod, L2632-2652 and L2770-2780): checking more variables
 * against a looser bar turns more ordinary days into false alarms. 100 dots, one per random day.
 */

const DAYS = Array.from({ length: 100 }, (_, day) => day);

/** Sliders in DOM order, so the demo can find and move them. */
const SLIDER_KEYS = ["variables", "years"] as const;

/*
 * The demo: checking every variable floods the board with false alarms; checking one leaves a
 * few; then it settles back on three.
 */
const DEMO: readonly DemoMove[] = [
  { slider: 0, to: 6, ms: 1100 },
  { slider: 0, to: 1, ms: 1300 },
  { slider: 0, to: 3, ms: 800 },
];

const DOT = {
  on: "block aspect-square rounded-full bg-action-primary transition-[background-color,scale] duration-300 ease-out motion-reduce:transition-none",
  off: "block aspect-square scale-[0.82] rounded-full bg-bg-surface-sunken transition-[background-color,scale] duration-300 ease-out motion-reduce:transition-none",
} as const;

type RareSliderProps = {
  label: string;
  value: number;
  limits: { min: number; max: number; step: number };
  onChange: (value: number) => void;
};

function RareSlider({ label, value, limits, onChange }: RareSliderProps) {
  return (
    <Slider
      value={value}
      minValue={limits.min}
      maxValue={limits.max}
      step={limits.step}
      onChange={onChange}
    >
      <Slider.Header>
        <Slider.Label>{label}</Slider.Label>
        <Slider.Output />
      </Slider.Header>
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

export function RareLab({ copy }: { copy: LabCopy }) {
  const { t } = useMemo(() => labTranslator(copy), [copy]);
  const [settings, setSettings] = useState<RareSettings>(DEFAULT_RARE);
  const result = rareChance(settings);

  const update = (key: "variables" | "years") => (value: number) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const rootRef = useRef<HTMLDivElement>(null);
  // The demo reads where a slider stands now, between renders.
  const live = useRef(settings);
  useEffect(() => {
    live.current = settings;
  });
  const read = useCallback((slider: number) => live.current[SLIDER_KEYS[slider] ?? "variables"], []);
  const write = useCallback((slider: number, value: number) => {
    const key = SLIDER_KEYS[slider] ?? "variables";
    const { min, max } = RARE_LIMITS[key];
    setSettings((current) => ({ ...current, [key]: Math.min(max, Math.max(min, Math.round(value))) }));
  }, []);
  const demo = useLabDemo(rootRef, DEMO, read, write);

  function handleBarChange(event: ChangeEvent<HTMLSelectElement>) {
    const bar = event.currentTarget.value;
    if (isRareBar(bar)) setSettings((current) => ({ ...current, bar }));
  }

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
        <RareSlider
          label={t("method.rare.vars")}
          value={settings.variables}
          limits={RARE_LIMITS.variables}
          onChange={update("variables")}
        />
        <RareSlider
          label={t("method.rare.years")}
          value={settings.years}
          limits={RARE_LIMITS.years}
          onChange={update("years")}
        />
        <Field label={t("method.rare.bar")}>
          <Select value={settings.bar} onChange={handleBarChange}>
            {RARE_BARS.map((bar) => (
              <option key={bar} value={bar}>
                {t(`method.rare.bar.${bar}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="grid w-full max-w-sm grid-cols-10 gap-1.5" aria-hidden="true">
          {DAYS.map((day) => (
            // A ripple: each dot follows a beat after the one before it.
            <i
              key={day}
              className={day < result.hits ? DOT.on : DOT.off}
              style={{ transitionDelay: `${Math.abs(day - result.hits) * 6}ms` }}
            />
          ))}
        </div>
        <p
          className="text-body-m text-text-primary max-w-[60ch]"
          aria-live="polite"
          aria-atomic="true"
        >
          <RichText
            text={t("method.rare.result", {
              pct: result.hits,
              n: result.oneIn,
              k: settings.variables,
            })}
          />
        </p>
      </div>
    </div>
  );
}
