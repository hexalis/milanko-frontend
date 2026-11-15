"use client";

import { Slider } from "@hexalis/design-system";
import { useMemo, useState, type ChangeEvent } from "react";
import { Field, Select } from "@/shared/ui/field";
import {
  DEFAULT_RARE,
  isRareBar,
  RARE_BARS,
  RARE_LIMITS,
  rareChance,
  type RareSettings,
} from "../domain/rare-lab";
import { labTranslator, type LabCopy } from "./lab-copy";
import { RichText } from "./rich-text";

/*
 * "Try it: peak or record?" (POC renderMethod, L2632-2652 and L2770-2780): checking more variables
 * against a looser bar turns more ordinary days into false alarms. 100 dots, one per random day.
 */

const DAYS = Array.from({ length: 100 }, (_, day) => day);

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

  function handleBarChange(event: ChangeEvent<HTMLSelectElement>) {
    const bar = event.currentTarget.value;
    if (isRareBar(bar)) setSettings((current) => ({ ...current, bar }));
  }

  return (
    <div className="expanded:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] grid gap-6">
      <div className="flex flex-col gap-4">
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
            <i
              key={day}
              className={`block aspect-square rounded-full ${
                day < result.hits ? "bg-action-primary" : "bg-bg-surface-sunken"
              }`}
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
