import Link from "next/link";
import { VerdictStamp } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PlayInView } from "./play-in-view";

/*
 * "Try it yourself" on the method page: a banner to the data playground, where the experiments
 * live. Beside what the reader can do there, a little lab plays what the playground does: a cursor
 * raises the noise and the verdict gives way (lab-banner.css). The whole card is the link.
 */

/* Thirteen years on a rising line: with a little noise, then with three times as much. */
const YEARS = 13;
const CALM = [2, -3, 3, -2, 1, -3, 2, -1, 3, -2, 1, -2, 2];
const NOISY = [8, -12, 14, -9, 6, -15, 11, -5, 16, -13, 4, -10, 9];
const x = (i: number) => 12 + i * 18;
const rise = (i: number) => 74 - i * 3.3;
const path = (wobble: readonly number[]) =>
  Array.from({ length: YEARS }, (_, i) => `${x(i)},${rise(i) + (wobble[i] ?? 0)}`).join(" ");

function LabScene({ translator: { t } }: { translator: Translator }) {
  return (
    <PlayInView className="lb-scene relative w-full max-w-md justify-self-center">
      <div className="rounded-card border-border-subtle bg-bg-surface shadow-raised grid gap-3 border p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label-s text-text-secondary font-semibold">
            {t("pg.legend.yours")}
          </span>
          <span className="grid justify-items-end">
            <span className="lb-stamp-yes col-start-1 row-start-1">
              <VerdictStamp verdict="confirmed" label={t("verdict.confirmed")} />
            </span>
            <span className="lb-stamp-no col-start-1 row-start-1">
              <VerdictStamp verdict="inconclusive" label={t("verdict.inconclusive")} />
            </span>
          </span>
        </div>
        <svg
          viewBox="0 0 240 110"
          className="max-medium:max-h-24 block h-auto w-full overflow-visible"
        >
          <line x1="8" x2="232" y1="104" y2="104" strokeWidth="1" className="stroke-chart-axis" />
          <g className="lb-calm">
            <polyline
              points={path(CALM)}
              fill="none"
              strokeWidth="2.4"
              className="stroke-chart-1"
            />
            <line
              x1={x(0)}
              x2={x(YEARS - 1)}
              y1={rise(0)}
              y2={rise(YEARS - 1)}
              strokeWidth="2.2"
              strokeDasharray="7 5"
              className="stroke-chart-trend"
            />
          </g>
          <g className="lb-noisy">
            <polyline
              points={path(NOISY)}
              fill="none"
              strokeWidth="2.4"
              className="stroke-chart-1"
            />
            <line
              x1={x(0)}
              x2={x(YEARS - 1)}
              y1={58}
              y2={52}
              strokeWidth="2.2"
              strokeDasharray="7 5"
              className="stroke-trend-neutral"
            />
          </g>
        </svg>
        <div className="grid gap-2">
          <div className="text-label-s flex items-center justify-between gap-3">
            <span className="text-text-primary font-semibold">{t("pg.noise")}</span>
            <span className="text-text-secondary grid justify-items-end font-mono">
              <span className="lb-calm col-start-1 row-start-1">× 1.0</span>
              <span className="lb-noisy col-start-1 row-start-1">× 3.0</span>
            </span>
          </div>
          {/* The track; the knob layer spans it, so its translate in % follows the track. */}
          <div className="relative mx-2 h-5">
            <span className="bg-border-subtle absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" />
            <span className="lb-fill bg-action-primary absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" />
            <span className="lb-knob absolute inset-0">
              <span className="lb-thumb border-action-primary bg-bg-surface absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full border-2" />
              <span className="lb-press border-action-primary absolute top-1/2 -left-4 size-8 -translate-y-1/2 rounded-full border-2" />
              <svg viewBox="0 0 24 24" className="lb-cursor absolute top-1/2 -left-1 size-7">
                <path
                  d="M4 2.5 19 12l-6.6 1.4L16 21l-2.9 1.3-3.6-7.6L4 19.5z"
                  fill="white"
                  stroke="black"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </PlayInView>
  );
}

export function LabBanner({ translator }: { translator: Translator }) {
  const { t } = translator;
  const things = [
    { icon: "chart", label: t("pg.tab.real") },
    { icon: "sparkle", label: t("method.lab.trend") },
    { icon: "dice", label: t("method.lab.rare") },
  ];
  return (
    <section
      aria-labelledby="method-lab"
      data-tour="method-lab"
      className="lb rounded-card border-border-subtle shadow-card has-focus-visible:outline-focus-ring medium:p-8 @container relative border p-5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
    >
      {/* Side by side once the banner itself is wide enough, whatever the window. */}
      {/* On a phone the text column melts into one column with the scene, which comes before the button. */}
      <div className="max-medium:gap-4 grid items-center gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @3xl:gap-12">
        <div className="max-medium:contents grid gap-4">
          <p className="text-overline text-text-brand inline-flex items-center gap-2">
            <Icon name="sparkle" size="sm" />
            {t("method.lab.title")}
          </p>
          <h2
            id="method-lab"
            className="text-heading-h1 max-medium:text-heading-h2 font-display text-text-primary max-w-[20ch] scroll-mt-6 text-balance"
          >
            {t("pg.cta.h")}
          </h2>
          <p className="text-body-l max-medium:text-body-m font-reading text-text-secondary max-w-[56ch]">
            {t("pg.cta.d")}
          </p>
          {/* On a phone the playground's own tabs name them; here the scene shows one. */}
          <ul className="max-medium:hidden m-0 grid list-none gap-2 p-0">
            {things.map((thing) => (
              <li
                key={thing.icon}
                className="text-body-m text-text-primary flex items-center gap-3"
              >
                <span className="bg-bg-surface-sunken text-text-brand grid size-8 shrink-0 place-items-center rounded-full">
                  <Icon name={thing.icon} size="sm" />
                </span>
                {thing.label}
              </li>
            ))}
          </ul>
          <Link
            href="/method/playground"
            className="lb-go bg-action-primary text-text-on-primary text-label-l max-medium:order-last max-medium:justify-self-stretch mt-2 inline-flex min-h-12 items-center justify-center gap-2 justify-self-start rounded-full px-6 font-semibold no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none"
          >
            {t("pg.cta")}
            <span className="lb-go-arrow inline-flex">
              <Icon name="arrow-right" size="sm" />
            </span>
          </Link>
        </div>
        <LabScene translator={translator} />
      </div>
    </section>
  );
}
