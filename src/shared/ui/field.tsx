import type { ComponentProps, ReactNode } from "react";

const CONTROL =
  "min-h-11 w-full min-w-0 rounded-lg border border-hairline bg-surface px-3 py-2 text-base text-ink shadow-clay placeholder:text-ink-placeholder";

type FieldProps = {
  label: string;
  children: ReactNode;
};

/** A label wrapping its control, so the pair needs no id wiring. */
export function Field({ label, children }: FieldProps) {
  return (
    <label className="text-ink-muted grid min-w-0 gap-1.5 text-xs font-extrabold tracking-[0.04em]">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input className={CONTROL} {...props} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select className={CONTROL} {...props} />;
}

type FilterBarProps = { children: ReactNode };

/** Responsive row of filters and actions at the top of a data page. */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="rounded-card bg-surface shadow-clay grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      {children}
    </div>
  );
}
