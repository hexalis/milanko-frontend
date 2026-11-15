import type { ReactNode } from "react";
import { tv } from "tailwind-variants";
import type { ExactRow, ReadingTone } from "../../domain/case-reading";
import type { Strength } from "../../domain/trend-stats";

/* Building blocks of the one case-file template (POC styles.css .cf-*). */

/** Ink of a reading's tone: confirmed, not proven, out of the ordinary, catalog artifact. */
export const toneInk = tv({
  variants: {
    tone: {
      yes: "text-status-ok-fg",
      no: "text-trend-neutral",
      anom: "text-status-late-fg",
      art: "text-status-review-fg",
    },
  },
});

const scaleBar = tv({
  base: "block w-2 rounded-2xs",
  variants: {
    isOn: { true: "", false: "bg-bg-surface-sunken" },
    tone: { yes: "", no: "", anom: "", art: "" },
  },
  compoundVariants: [
    { isOn: true, tone: "yes", class: "bg-status-ok" },
    { isOn: true, tone: "no", class: "bg-trend-neutral" },
    { isOn: true, tone: "anom", class: "bg-status-late" },
    { isOn: true, tone: "art", class: "bg-status-review" },
  ],
});

const LEVELS: Record<Strength, number> = { weak: 1, moderate: 2, strong: 3 };
const BAR_HEIGHTS = ["h-[9px]", "h-[14px]", "h-[19px]"] as const;

/** Three ascending bars and the word (POC cf-scale): never a percentage. */
export function ToneScale({
  level,
  tone,
  word,
}: {
  level: Strength;
  tone: ReadingTone;
  word: string;
}) {
  return (
    <p className="flex items-center gap-3">
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {BAR_HEIGHTS.map((height, index) => (
          <i
            key={height}
            className={`${scaleBar({ isOn: index < LEVELS[level], tone })} ${height}`}
          />
        ))}
      </span>
      <strong className={`text-body-l font-display font-semibold ${toneInk({ tone })}`}>
        {word}
      </strong>
    </p>
  );
}

/** The exact figures under a plain sentence (POC cf-exact): a dashed rule, then label and value. */
export function ExactList({ rows }: { rows: ExactRow[] }) {
  if (!rows.length) return null;
  return (
    <dl className="border-border-strong text-text-secondary mt-4 border-t border-dashed pt-3 font-mono text-[13px] leading-7 break-words">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-text-primary me-1.5 inline font-sans text-[12px] font-semibold">
            {row.label}
          </dt>
          <dd className="inline">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A plain sentence, the reading line of every section. */
export function Plain({ children }: { children: ReactNode }) {
  return <p className="text-body-l font-reading text-text-primary max-w-[60ch]">{children}</p>;
}

const card = tv({
  base: "rounded-card p-5 medium:p-6",
  variants: {
    look: {
      paper: "bg-bg-surface shadow-card",
      dashed: "border border-dashed border-border-strong",
    },
  },
  defaultVariants: { look: "paper" },
});

type ReadingSectionProps = {
  id: string;
  title: string;
  look?: "paper" | "dashed";
  children: ReactNode;
};

/** One numbered-free section of the reading: an h2 and its card. */
export function ReadingSection({ id, title, look, children }: ReadingSectionProps) {
  return (
    <section aria-labelledby={id} className="flex scroll-mt-20 flex-col gap-2.5">
      <h2 id={id} className="text-heading-h3 font-display text-text-primary font-semibold">
        {title}
      </h2>
      <div className={card({ look })}>{children}</div>
    </section>
  );
}
