import Link from "next/link";
import type { ReactNode } from "react";
import { buttonLink } from "@/shared/ui/button";
import { SourcesList, type CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import type { GuidedView } from "../domain/guided";

export type StepProps = { view: GuidedView; translator: Translator; catalog: CaseCatalog };

/* Small pieces shared by the guided steps and the comparison (POC .crumbs, .callout-box, .ask-nav…). */

// A transparent ::after stretches the 18px crumb to a 44px tap target, without reflow.
const CRUMB_LINK =
  "hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-[13px] after:content-[''] hover:underline";

type GuidedCrumbsProps = {
  navLabel: string;
  links: { href: string; label: string }[];
  current: string;
};

export function GuidedCrumbs({ navLabel, links, current }: GuidedCrumbsProps) {
  return (
    <nav aria-label={navLabel} className="text-label-m medium:pt-8 pt-6 pb-4">
      <ol className="text-text-secondary flex flex-wrap items-center gap-1.5">
        {links.map((link) => (
          <li key={link.href} className="flex items-center gap-1.5">
            <Link href={link.href} className={CRUMB_LINK}>
              {link.label}
            </Link>
            <Icon name="caret-right" size="sm" />
          </li>
        ))}
        <li className="text-text-primary" aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  );
}

const CALLOUT =
  "rounded-card bg-bg-surface shadow-card grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 px-[18px] py-4";

type CalloutProps = {
  icon: string;
  title?: string;
  /** Anchor of this remark in the page's tour (`data-tour`). */
  tour?: string;
  children: ReactNode;
};

/** A boxed remark: an icon, an optional bold lead-in, and the sentence. */
export function GuidedCallout({ icon, title, tour, children }: CalloutProps) {
  return (
    <div data-tour={tour} className={CALLOUT}>
      <span className="text-text-brand mt-0.5 text-[22px]">
        <Icon name={icon} />
      </span>
      <p className="text-body-l font-reading text-text-primary max-w-[60ch]">
        {title ? <strong className="block">{title}</strong> : null}
        {children}
      </p>
    </div>
  );
}

/** Lead paragraph of a step. */
export function StepLead({ children }: { children: ReactNode }) {
  return <p className="text-body-l font-reading text-text-secondary max-w-[60ch]">{children}</p>;
}

export type ScienceRow = { key: string; term: ReactNode; value: ReactNode };

/** Extra figures of the scientific depth: same numbers, more of them. */
export function ScienceList({ rows }: { rows: ScienceRow[] }) {
  return (
    <dl className="rounded-card bg-bg-surface-sunken medium:grid-cols-2 grid gap-x-6 gap-y-4 p-4">
      {rows.map((row) => (
        <div key={row.key} className="flex min-w-0 flex-col gap-1">
          <dt className="text-label-m text-text-secondary">{row.term}</dt>
          <dd className="text-text-primary font-mono text-[14px] break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const DIRECTION_INK = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-trend-neutral",
} as const;

/** The headline rate with its direction arrow: "↑ +0.9 °C per decade". */
export function RateFigure({
  direction,
  rate,
  perDecade,
}: {
  direction: keyof typeof DIRECTION_INK;
  rate: string;
  perDecade: string;
}) {
  return (
    <p
      className={`text-figure-l font-display flex items-baseline gap-2.5 font-semibold tabular-nums ${DIRECTION_INK[direction]}`}
    >
      <span className="self-center">
        <Icon name={direction} size="lg" />
      </span>
      {rate}
      <span className="text-body-m text-text-secondary font-sans">{perDecade}</span>
    </p>
  );
}

const POWER_URL = "https://power.larc.nasa.gov/";

/** The two sources every guided answer cites (POC sources()). */
export function GuidedSources({
  variable,
  translator,
}: {
  variable: string;
  translator: Translator;
}) {
  return (
    <SourcesList
      newTabHint={translator.t("link.newTab")}
      items={[
        {
          icon: "chart",
          name: `NASA POWER · ${variable}`,
          url: POWER_URL,
          description: translator.t("src.d.power"),
        },
        {
          icon: "csv",
          name: "portal/scripts/build_cases.py",
          description: translator.t("src.d.script"),
        },
      ]}
    />
  );
}

/** A quiet fold under a result (POC .lesson-more): the detail is there for whoever wants it. */
export function LessonMore({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group/more rounded-card bg-bg-surface shadow-card border border-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] px-4 py-1 open:pb-4">
      <summary className="text-body-m text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-2.5 font-semibold [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="transition-transform group-open/more:rotate-180 motion-reduce:transition-none">
          <Icon name="caret-down" />
        </span>
      </summary>
      <div className="flex flex-col gap-4">{children}</div>
    </details>
  );
}

type NavLink = { href: string; label: string };

/** Back and forward along the investigation. */
type GuidedNavProps = {
  label: string;
  back: NavLink;
  next: NavLink;
  /** Anchor of this nav in the page's tour (`data-tour`). */
  tour?: string;
};

export function GuidedNav({ label, back, next, tour }: GuidedNavProps) {
  return (
    <nav
      aria-label={label}
      data-tour={tour}
      className="flex max-w-[980px] flex-wrap justify-between gap-3"
    >
      <Link href={back.href} className={buttonLink({ intent: "secondary" })}>
        <Icon name="arrow-left" />
        {back.label}
      </Link>
      <Link href={next.href} className={buttonLink()}>
        {next.label}
        <Icon name="arrow-right" />
      </Link>
    </nav>
  );
}

/**
 * The next question or comparison (POC .compare), as the close's main way on: a brand-filled card
 * with the question in large type and one round arrow, so it reads as the next step, not a link.
 */
export function NextQuestionLink({ href, label, title }: NavLink & { title: string }) {
  return (
    <Link
      href={href}
      className="group/next bg-action-primary text-text-on-primary shadow-raised duration-base hover:shadow-dropdown focus-visible:focus-ring focus-visible:outline-focus-ring medium:gap-5 medium:p-6 relative isolate flex items-center gap-4 overflow-hidden rounded-[24px] p-5 no-underline transition-[translate,box-shadow] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* A large faint mark of the question, behind the words. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -end-6 -bottom-10 -z-10 text-[160px] opacity-10 transition-[rotate] duration-500 group-hover/next:-rotate-6 motion-reduce:transition-none"
      >
        <Icon name="ask" />
      </span>
      <span className="medium:grid hidden size-14 flex-none place-items-center rounded-2xl bg-[color-mix(in_oklab,currentColor_14%,transparent)] text-[28px]">
        <Icon name="ask" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label-m font-semibold opacity-80">{label}</span>
        <span className="font-display medium:text-[26px] text-[21px] leading-tight font-semibold text-balance">
          {title}
        </span>
      </span>
      <span className="bg-bg-surface text-text-primary shadow-card duration-fast grid size-12 flex-none place-items-center rounded-full text-[22px] transition-[translate] group-hover/next:translate-x-1 motion-reduce:transition-none">
        <Icon name="arrow-right" />
      </span>
    </Link>
  );
}
