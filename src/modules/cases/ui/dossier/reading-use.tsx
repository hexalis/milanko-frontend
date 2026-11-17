import Link from "next/link";
import { tv } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import type { CaseReading } from "../../domain/case-reading";
import { Citation } from "./citation";
import { CopyTextButton } from "./copy-text-button";

/*
 * "Use it" (POC cfUse): what a reader takes away from the file, in three parts.
 *  - Cite it: the sentence to quote, set as a pull quote, with the buttons to copy it, the
 *    citation and the link; the full citation folds away under "How to cite".
 *  - Think about it: three questions as cards, each answer folded until asked for.
 *  - Follow the lead: the globe, the region and the related files as tiles.
 */

const CITE_ID = "cf-cite";

const PART_TITLE = "text-overline text-text-tertiary flex items-center gap-1.5";

const DISCLOSURE = [
  "text-label-m text-text-link inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full",
  "border border-border-subtle px-3 py-1 hover:bg-action-secondary-hover",
  "focus-visible:focus-ring focus-visible:outline-focus-ring [&::-webkit-details-marker]:hidden",
].join(" ");

const CARET = "transition-transform duration-fast motion-reduce:transition-none";

type UseProps = { reading: CaseReading; translator: Translator };

function CiteIt({ reading, translator }: UseProps) {
  const { t } = translator;
  const { use } = reading;
  return (
    <div className="rounded-card bg-bg-surface shadow-card medium:p-6 p-5">
      <h3 className={PART_TITLE}>
        <Icon name="link" size="sm" />
        {t("cf.use.cite")}
      </h3>
      <p className="text-body-s text-text-secondary mt-1">{t("cf.quote.lead")}</p>
      <figure className="border-action-primary relative mt-4 border-s-4 ps-5">
        <span
          aria-hidden="true"
          className="font-display text-action-primary pointer-events-none absolute -start-1 -top-5 text-[56px] leading-none opacity-25 select-none"
        >
          “
        </span>
        <blockquote className="font-reading text-text-primary text-[clamp(17px,1.6vw,20px)] leading-relaxed">
          {use.quote}
        </blockquote>
      </figure>
      <div data-tour="cf-copy" className="mt-5 flex flex-wrap gap-2">
        <CopyTextButton
          intent="primary"
          text={use.quote}
          labels={{ idle: t("cf.copy.quote"), copied: t("case.copied") }}
        />
        <CopyTextButton
          sourceId={CITE_ID}
          labels={{ idle: t("case.cite.copy"), copied: t("case.copied") }}
        />
        {use.isShareable ? (
          <CopyTextButton labels={{ idle: t("share.copy"), copied: t("share.done") }} />
        ) : null}
      </div>
      <details className="group/cite mt-4">
        <summary className={DISCLOSURE}>
          <span className={`${CARET} group-open/cite:rotate-90`}>
            <Icon name="caret-right" size="sm" />
          </span>
          {t("case.cite")}
        </summary>
        <Citation id={CITE_ID} lines={use.cite} />
      </details>
    </div>
  );
}

function ThinkAboutIt({ reading, translator }: UseProps) {
  const { t } = translator;
  return (
    <div>
      <h3 className={PART_TITLE}>
        <Icon name="ask" size="sm" />
        {t("case.think")}
      </h3>
      <ol className="medium:grid-cols-3 mt-2.5 grid gap-3">
        {reading.use.think.map((item, index) => (
          <li
            key={item.q}
            className="rounded-card bg-bg-surface shadow-card flex flex-col gap-3 p-4"
          >
            <span
              aria-hidden="true"
              className="bg-action-selected text-text-brand grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular-nums"
            >
              {index + 1}
            </span>
            <p className="text-body-m text-text-primary">{item.q}</p>
            <details className="group/answer mt-auto">
              <summary className={DISCLOSURE}>
                <span className={`${CARET} group-open/answer:rotate-180`}>
                  <Icon name="caret-down" size="sm" />
                </span>
                {t("case.think.answer")}
              </summary>
              <p className="text-body-s text-text-secondary mt-2.5">{item.a}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

/*
 * Each lead is a call to action: the first (the globe, as a rule) filled in the brand colour, the
 * rest outlined in it. A round arrow on the right fills on hover as the tile lifts.
 */
const lead = tv({
  slots: {
    tile: [
      "group/lead rounded-card relative flex min-h-[76px] items-center gap-4 p-4 medium:p-5 no-underline",
      "transition-[translate,box-shadow,background-color,border-color] duration-fast motion-reduce:transition-none",
      "hover:-translate-y-0.5 active:translate-y-0 focus-visible:focus-ring focus-visible:outline-focus-ring",
    ],
    badge: "grid size-11 shrink-0 place-items-center rounded-full",
    label: "text-label-l min-w-0 font-semibold text-balance",
    arrow: [
      "ms-auto grid size-9 shrink-0 place-items-center rounded-full",
      "transition-[translate,background-color,color] duration-fast motion-reduce:transition-none group-hover/lead:translate-x-0.5",
    ],
  },
  variants: {
    isMain: {
      true: {
        tile: "bg-action-primary text-text-on-primary shadow-raised hover:bg-action-primary-hover",
        badge: "bg-white/15",
        arrow: "bg-white/20 group-hover/lead:bg-white/30",
      },
      false: {
        tile: "bg-bg-surface text-text-primary shadow-card border border-action-primary/35 hover:border-action-primary hover:shadow-raised",
        badge: "bg-action-primary text-text-on-primary",
        arrow:
          "bg-action-selected text-text-brand group-hover/lead:bg-action-primary group-hover/lead:text-text-on-primary",
      },
    },
  },
});

function FollowTheLead({ reading, translator }: UseProps) {
  const { t } = translator;
  return (
    <div>
      <h3 className={PART_TITLE}>
        <Icon name="globe-pin" size="sm" />
        {t("cf.use.more")}
      </h3>
      <ul className="mt-2.5 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
        {reading.use.related.map((link, index) => {
          const parts = lead({ isMain: index === 0 });
          return (
            <li key={link.href}>
              <Link href={link.href} className={`${parts.tile()} h-full`}>
                <span className={parts.badge()}>
                  <Icon name={link.icon} />
                </span>
                <span className={parts.label()}>{link.label}</span>
                <span aria-hidden="true" className={parts.arrow()}>
                  <Icon name="arrow-right" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function UseSection({ reading, translator }: UseProps) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="cf-use"
      data-tour="cf-use"
      className="flex scroll-mt-20 flex-col gap-5"
    >
      <div>
        <h2 id="cf-use" className="text-heading-h3 font-display text-text-primary font-semibold">
          {t("cf.s.use")}
        </h2>
        <p className="text-body-m text-text-secondary mt-1">{t("cf.use.lead")}</p>
      </div>
      <CiteIt reading={reading} translator={translator} />
      <ThinkAboutIt reading={reading} translator={translator} />
      <FollowTheLead reading={reading} translator={translator} />
    </section>
  );
}
