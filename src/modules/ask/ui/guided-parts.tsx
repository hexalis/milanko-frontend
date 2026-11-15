import Link from "next/link";
import type { ReactNode } from "react";
import { buttonLink } from "@/shared/ui/button";
import type { CaseCatalog } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import type { GuidedView } from "../domain/guided";

export type StepProps = { view: GuidedView; translator: Translator; catalog: CaseCatalog };

/* Small pieces shared by the guided steps and the comparison (POC .crumbs, .callout-box, .ask-nav…). */

const CRUMB_LINK =
  "hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring underline-offset-2 hover:underline";

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

type CalloutProps = { icon: string; title?: string; children: ReactNode };

/** A boxed remark: an icon, an optional bold lead-in, and the sentence. */
export function GuidedCallout({ icon, title, children }: CalloutProps) {
  return (
    <div className={CALLOUT}>
      <span className="text-text-brand mt-0.5 text-[22px]">
        <Icon name={icon} />
      </span>
      <p className="text-body-l text-text-primary max-w-[72ch]">
        {title ? <strong className="block">{title}</strong> : null}
        {children}
      </p>
    </div>
  );
}

/** Lead paragraph of a step. */
export function StepLead({ children }: { children: ReactNode }) {
  return <p className="text-body-l text-text-secondary max-w-[68ch]">{children}</p>;
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
      className={`text-figure-l flex items-baseline gap-2.5 font-mono ${DIRECTION_INK[direction]}`}
    >
      <span className="self-center">
        <Icon name={direction} size="lg" />
      </span>
      {rate}
      <span className="text-body-m text-text-secondary font-sans">{perDecade}</span>
    </p>
  );
}

type NavLink = { href: string; label: string };

/** Back and forward along the investigation. */
export function GuidedNav({ label, back, next }: { label: string; back: NavLink; next: NavLink }) {
  return (
    <nav aria-label={label} className="flex max-w-[980px] flex-wrap justify-between gap-3">
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

/** A card-sized link to the next question or comparison (POC .compare). */
export function NextQuestionLink({ href, label, title }: NavLink & { title: string }) {
  return (
    <Link
      href={href}
      className="rounded-card bg-bg-surface shadow-card text-text-primary duration-fast hover:shadow-raised focus-visible:focus-ring focus-visible:outline-focus-ring relative flex flex-col gap-0.5 py-[18px] pr-14 pl-5 no-underline transition-[transform,box-shadow] hover:-translate-y-0.5"
    >
      <span className="text-label-m text-text-secondary">{label}</span>
      <span className="text-heading-h3 font-display">{title}</span>
      <span className="text-text-brand absolute top-1/2 right-5 -translate-y-1/2 text-[22px]">
        <Icon name="arrow-right" />
      </span>
    </Link>
  );
}
