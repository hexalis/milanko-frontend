import Link from "next/link";
import type { ReactNode } from "react";
import { tv } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import type { CaseReading } from "../../domain/case-reading";
import { ExactList, Plain, toneInk } from "./reading-parts";

/* Top of a case file: crumbs, the question as h1, the chips and the answer (POC renderFile head). */

const answerCard = tv({
  base: "rounded-card bg-bg-surface shadow-card medium:p-6 border-s-[6px] p-5",
  variants: {
    tone: {
      yes: "border-status-ok",
      no: "border-trend-neutral",
      anom: "border-status-late",
      art: "border-status-review",
    },
  },
});

const figure = tv({
  base: "font-display inline-flex items-center gap-2 leading-none font-semibold tracking-tight tabular-nums",
  variants: {
    isSoft: { true: "text-[clamp(26px,2.8vw,32px)]", false: "text-[clamp(34px,4.4vw,48px)]" },
    direction: {
      up: "text-trend-up",
      down: "text-trend-down",
      flat: "text-trend-neutral",
      none: "text-text-primary",
    },
  },
});

type HeadProps = { reading: CaseReading; translator: Translator };

function Crumbs({ reading, translator }: HeadProps) {
  return (
    <nav aria-label={translator.t("nav.breadcrumb")} className="text-label-m">
      <ol className="text-text-secondary flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href={reading.crumb.href}
            className="hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-[13px] after:content-[''] hover:underline"
          >
            {reading.crumb.label}
          </Link>
        </li>
        <li aria-hidden="true">
          <Icon name="caret-right" size="sm" />
        </li>
        <li className="text-text-primary font-mono" aria-current="page">
          {reading.crumb.code}
        </li>
      </ol>
    </nav>
  );
}

function AnswerCard({ reading, translator }: HeadProps) {
  const { answer } = reading;
  return (
    <section
      aria-labelledby="cf-answer"
      data-tour="cf-answer"
      className={`mt-3 ${answerCard({ tone: answer.tone })}`}
    >
      <h2 id="cf-answer" className="sr-only">
        {translator.t("cf.s.answer")}
      </h2>
      <p
        data-tour="cf-verdict"
        className={`font-display flex items-center gap-2.5 text-[clamp(22px,2.6vw,28px)] font-semibold ${toneInk({ tone: answer.tone })}`}
      >
        <Icon name={answer.icon} size="lg" />
        {answer.word}
      </p>
      <div className="mt-1.5">
        <Plain>{answer.plain}</Plain>
      </div>
      <p data-tour="cf-figure" className="mt-4 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <strong
          className={figure({ isSoft: answer.isSoft, direction: answer.figDirection ?? "none" })}
        >
          {answer.figIcon ? <Icon name={answer.figIcon} size="lg" /> : null}
          {answer.fig}
        </strong>
        <span className="text-body-s text-text-secondary max-w-[42ch]">{answer.figNote}</span>
      </p>
      <ExactList rows={answer.exact} />
    </section>
  );
}

/** `tour` is the page's tour button, beside the breadcrumb. */
export function ReadingHead({ reading, translator, tour }: HeadProps & { tour?: ReactNode }) {
  return (
    <>
      <div className="medium:pt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-6">
        <Crumbs reading={reading} translator={translator} />
        {tour}
      </div>
      <h1 className="text-display-s font-display text-text-primary max-w-[28ch] font-semibold text-balance">
        {reading.question}
      </h1>
      <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
        {reading.chips.map((chip) => (
          <li
            key={chip.icon}
            className="border-border-subtle bg-bg-surface text-body-s text-text-secondary inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
          >
            <Icon name={chip.icon} />
            {chip.text}
          </li>
        ))}
      </ul>
      <AnswerCard reading={reading} translator={translator} />
    </>
  );
}
