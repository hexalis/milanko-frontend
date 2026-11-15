import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const statGrid = tv({
  base: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  variants: {
    columns: { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" },
  },
  defaultVariants: { columns: 4 },
});

type StatGridProps = VariantProps<typeof statGrid> & { children: ReactNode };

export function StatGrid({ columns, children }: StatGridProps) {
  return <div className={statGrid({ columns })}>{children}</div>;
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
};

/** One figure with its label and a muted context line. */
export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <article className="rounded-card bg-surface shadow-clay min-w-0 p-4 sm:p-5">
      <p className="text-ink-muted text-xs font-extrabold tracking-[0.1em] uppercase">{label}</p>
      <p className="font-display mt-1.5 text-[26px] leading-tight font-extrabold break-words">
        {value}
      </p>
      {meta ? <p className="text-ink-muted mt-1 text-[13px] font-semibold">{meta}</p> : null}
    </article>
  );
}
