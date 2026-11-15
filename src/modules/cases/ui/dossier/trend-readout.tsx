import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { period, type Direction, type TrendCase } from "../../domain/case-file";
import { formatFigure, formatOdds, formatP, unitLabel } from "../../domain/format";
import { trendReadout } from "../../domain/readout";
import { GlossaryTerm } from "./glossary-term";

/*
 * Appendix readout of a trend file (POC trendReadout, DESIGN.md · Appendix readout): the test as
 * three questions, drawn from the same numbers listed in the fold below it.
 */

const CI_FILL: Record<Direction, string> = {
  up: "bg-surface-tone-1",
  down: "bg-surface-tone-2",
  flat: "bg-bg-surface-sunken",
};
const SIGNAL_FILL: Record<Direction, string> = {
  up: "bg-trend-up",
  down: "bg-trend-down",
  flat: "bg-trend-neutral",
};

const at = (percent: number) => ({ left: `${percent}%` });

function Gauge({
  question,
  figure,
  answer,
  children,
}: {
  question: string;
  figure: ReactNode;
  answer: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="rounded-card bg-bg-surface shadow-card m-0 flex flex-col gap-3 p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-body-m-strong text-text-primary">{question}</span>
        <span className="text-text-primary font-mono text-[15px] font-semibold">{figure}</span>
      </figcaption>
      {children}
      <p className="text-body-s text-text-secondary">{answer}</p>
    </figure>
  );
}

function Mark({ left, className }: { left: number; className: string }) {
  return (
    <i
      className={`ring-bg-surface absolute -top-[5px] -ml-0.5 h-5 w-1 rounded-sm ring-2 ${className}`}
      style={at(left)}
    />
  );
}

/** Replaces the glossary name inside a sentence with the term and its definition button. */
function withTerm(sentence: string, term: string, translator: Translator): ReactNode {
  const name = translator.t(`gloss.${term}`);
  const [before, ...rest] = sentence.split(name);
  if (!rest.length) return sentence;
  return (
    <>
      {before}
      <GlossaryTerm term={term} translator={translator} />
      {rest.join(name)}
    </>
  );
}

export function TrendReadout({ file, translator }: { file: TrendCase; translator: Translator }) {
  const { t } = translator;
  const { t: stats } = file;
  const readout = trendReadout(stats);
  const digits = file.digits + 1;
  const unit = unitLabel(file.unit, translator.locale);
  const withUnit = (text: string) => (unit ? `${text} ${unit}` : text);
  const { from, to } = period(file.series);
  const ci = {
    lo: formatFigure(readout.slope.low, digits, true),
    hi: formatFigure(readout.slope.high, digits, true),
  };

  return (
    <div className="grid gap-3">
      <Gauge
        question={t("ro.p.q")}
        figure={
          <>
            <GlossaryTerm term="p" label="p" translator={translator} /> {formatP(stats.p)}
          </>
        }
        answer={`${t(`ro.p.${stats.strength}`)}${
          readout.p.hasExactFigure
            ? ` ${t("ro.p.exact", { p: stats.p.toPrecision(2), odds: formatOdds(stats.p, translator) })}`
            : ""
        }`}
      >
        <div className="bg-bg-surface-sunken relative mt-1.5 h-2.5 rounded-full" aria-hidden="true">
          <span
            className="bg-status-ok-bg absolute inset-y-0"
            style={{
              left: `${readout.p.moderate}%`,
              width: `${readout.p.strong - readout.p.moderate}%`,
            }}
          />
          <span
            className="bg-status-ok-border absolute inset-y-0 right-0 rounded-r-full"
            style={at(readout.p.strong)}
          />
          <Mark left={readout.p.mark} className="bg-text-primary" />
        </div>
        <div className="text-text-tertiary relative h-4 font-mono text-[12px]" aria-hidden="true">
          <span className="absolute top-0 left-0">1</span>
          <span className="absolute top-0 -translate-x-1/2" style={at(readout.p.moderate)}>
            0.05
          </span>
          <span className="absolute top-0 -translate-x-1/2" style={at(readout.p.strong)}>
            0.01
          </span>
          <span className="absolute top-0 right-0">0.0001</span>
        </div>
      </Gauge>

      <Gauge
        question={t("ro.ci.q")}
        figure={`${withUnit(formatFigure(readout.slope.mid, digits, true))} ${t("unit.decade")}`}
        answer={withTerm(
          t(readout.slope.isClear ? "ro.ci.clear" : "ro.ci.cross", ci),
          "ci",
          translator,
        )}
      >
        <div
          className="before:bg-border-subtle relative mt-1.5 h-2.5 before:absolute before:inset-x-0 before:top-1/2 before:h-px"
          aria-hidden="true"
        >
          <span className="bg-text-tertiary absolute -inset-y-[5px] left-1/2 w-px" />
          <span
            className={`absolute inset-y-0 rounded-full ${CI_FILL[readout.direction]}`}
            style={{ left: `${readout.slope.from}%`, width: `${readout.slope.width}%` }}
          />
          <Mark left={readout.slope.mark} className={SIGNAL_FILL[readout.direction]} />
        </div>
        <div className="text-text-tertiary relative h-4 font-mono text-[12px]" aria-hidden="true">
          <span className="absolute top-0 left-1/2 -translate-x-1/2">0</span>
        </div>
      </Gauge>

      <Gauge
        question={t("ro.snr.q")}
        figure={`${stats.snr.toFixed(1)}×`}
        answer={t("case.metric.snr.d", { x: stats.snr.toFixed(1) })}
      >
        <div className="text-body-s grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2">
          <span className="text-text-secondary whitespace-nowrap">
            {t("ro.snr.signal", { from, to })}
          </span>
          <span
            className={`h-2.5 min-w-1 justify-self-start rounded-full ${SIGNAL_FILL[readout.direction]}`}
            style={{ width: `${readout.swing.signal}%` }}
          />
          <span className="text-text-primary text-right font-mono">
            {withUnit(formatFigure(stats.total, digits, true))}
          </span>
          <span className="text-text-secondary whitespace-nowrap">{t("ro.snr.noise")}</span>
          <span
            className="bg-text-tertiary h-2.5 min-w-1 justify-self-start rounded-full"
            style={{ width: `${readout.swing.noise}%` }}
          />
          <span className="text-text-primary text-right font-mono">
            {withUnit(`±${formatFigure(stats.noise, digits)}`)}
          </span>
        </div>
      </Gauge>
    </div>
  );
}
