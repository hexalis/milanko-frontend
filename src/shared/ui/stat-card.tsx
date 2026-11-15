import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { StatFooter, StatLabel, StatRoot, StatValue } from "./hexalis";

const statGrid = tv({
  base: "grid grid-cols-1 gap-4 medium:grid-cols-2",
  variants: {
    columns: { 3: "expanded:grid-cols-3", 4: "expanded:grid-cols-4" },
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

/** DS Stat tile: label, figure and a muted context line. */
export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <StatRoot layout="card">
      <StatLabel>{label}</StatLabel>
      {/* Region names and periods are longer than a KPI figure: let them wrap. */}
      <StatValue className="text-heading-h3 font-display break-words whitespace-normal">
        {value}
      </StatValue>
      {meta ? <StatFooter>{meta}</StatFooter> : null}
    </StatRoot>
  );
}
