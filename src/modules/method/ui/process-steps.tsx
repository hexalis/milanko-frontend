"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/shared/ui/icon";

/*
 * The five steps as one pipeline instead of five long rows: the stations sit on a line that fills
 * up to the step on screen, and that step's panel shows what it does and how. One step at a time
 * keeps the page short; the line keeps the whole journey in view. WAI-ARIA tabs: arrows, Home and
 * End move between steps.
 */

type ProcessStep = { icon: string; title: string; text: string; how: string };

type ProcessStepsProps = {
  steps: readonly ProcessStep[];
  copy: { label: string; how: string; prev: string; next: string; of: string };
};

const STATION =
  "group/step relative z-10 flex cursor-pointer flex-col items-center gap-2 rounded-md px-1 pt-1 pb-2 text-center focus-visible:focus-ring focus-visible:outline-focus-ring";

const DOT =
  "grid size-12 place-items-center rounded-full border-2 border-border-default bg-bg-surface text-xl text-icon-secondary transition-[background-color,border-color,color,scale] duration-base group-hover/step:border-action-primary group-hover/step:text-icon-brand group-aria-selected/step:scale-110 group-aria-selected/step:border-action-primary group-aria-selected/step:bg-action-primary group-aria-selected/step:text-text-on-primary data-[done=true]:border-action-primary data-[done=true]:text-icon-brand motion-reduce:transition-none medium:size-14";

const NAV =
  "inline-flex min-h-touch-min cursor-pointer items-center gap-1.5 rounded-sm px-3 text-label-m font-semibold text-text-secondary hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring disabled:cursor-default disabled:opacity-40";

export function ProcessSteps({ steps, copy }: ProcessStepsProps) {
  const base = useId();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const last = steps.length - 1;
  const step = steps[active];

  function go(index: number, { focus = false } = {}) {
    const next = Math.min(last, Math.max(0, index));
    setActive(next);
    if (focus) refs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: last,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    go(target, { focus: true });
  }

  return (
    <div className="grid gap-5">
      <div className="relative">
        {/* The rail behind the stations, filled up to the step on screen. */}
        <span
          aria-hidden="true"
          className="bg-border-default medium:top-8 absolute inset-x-[10%] top-7 h-0.5 rounded-full"
        >
          <span
            className="bg-action-primary ease-standard duration-500 block h-full origin-left rounded-full transition-[scale] motion-reduce:transition-none"
            style={{ scale: `${last ? active / last : 0} 1` }}
          />
        </span>
        <div role="tablist" aria-label={copy.label} className="grid grid-cols-5 gap-1">
          {steps.map((item, index) => (
            <button
              key={item.title}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${base}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => go(index)}
              onKeyDown={onKeyDown}
              className={STATION}
            >
              <span className={DOT} data-done={index < active}>
                <Icon name={item.icon} />
              </span>
              <span className="text-label-s text-text-tertiary font-mono">{`0${index + 1}`}</span>
              <span className="text-label-m medium:text-body-m text-text-secondary group-aria-selected/step:text-text-primary leading-tight font-semibold">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {step ? (
        <div
          key={active}
          role="tabpanel"
          id={`${base}-panel`}
          aria-labelledby={`${base}-tab-${active}`}
          className="animate-enter rounded-card bg-bg-surface shadow-card medium:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] medium:p-6 grid gap-4 p-5"
        >
          <div className="grid content-start gap-2">
            <p className="text-label-s text-text-brand font-mono tracking-wide uppercase">
              {copy.of.replace("{n}", String(active + 1)).replace("{total}", String(steps.length))}
            </p>
            <h3 className="text-heading-h3 font-display text-text-primary">{step.title}</h3>
            <p className="text-body-l text-text-primary">{step.text}</p>
          </div>
          <div className="rounded-md bg-bg-surface-sunken grid content-start gap-1.5 p-4">
            <p className="text-label-m text-text-secondary flex items-center gap-1.5 font-semibold">
              <Icon name="info" />
              {copy.how}
            </p>
            <p className="text-body-s text-text-secondary">{step.how}</p>
          </div>
          <div className="medium:col-span-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className={NAV}
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <Icon name="arrow-left" />
              {copy.prev}
            </button>
            <button
              type="button"
              className={NAV}
              disabled={active === last}
              onClick={() => go(active + 1)}
            >
              {copy.next}
              <Icon name="arrow-right" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
