import type { ReactNode } from "react";

type PanelProps = {
  /** Panel heading; rendered as an h2. */
  title?: string;
  /** Muted line beside the heading (counts, units, period). */
  meta?: ReactNode;
  children: ReactNode;
};

/** White clay card holding a record: a table, a chart or a form. */
export function Panel({ title, meta, children }: PanelProps) {
  return (
    <section className="rounded-card bg-surface shadow-clay min-w-0 p-4 sm:p-6">
      {title ? (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[22px]">{title}</h2>
          {meta ? <p className="text-ink-muted text-[13px] font-semibold">{meta}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
