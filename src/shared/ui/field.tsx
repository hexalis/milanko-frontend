import type { ComponentProps, ReactNode } from "react";

/*
 * Native controls styled with DS field tokens. They stay native (not the React Aria Select)
 * because the data pages filter through plain GET forms whose values live in the URL.
 */
const CONTROL =
  "h-touch-min medium:h-10 w-full min-w-0 rounded-field border border-border-input bg-bg-surface px-3 text-body-m text-text-primary shadow-control transition-colors duration-fast hover:border-border-strong focus-visible:focus-ring focus-visible:outline-focus-ring placeholder:text-text-tertiary";

type FieldProps = {
  label: string;
  children: ReactNode;
};

/** A label wrapping its control, so the pair needs no id wiring. */
export function Field({ label, children }: FieldProps) {
  return (
    <label className="text-label-m text-text-secondary grid min-w-0 gap-1.5">
      {label}
      {children}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input className={CONTROL} {...props} />;
}

/** Styled as the portal's own dropdown where the browser allows it (see .field-select in globals.css). */
export function Select(props: ComponentProps<"select">) {
  return <select className={`field-select ${CONTROL}`} {...props} />;
}

type FilterBarProps = { children: ReactNode };

/** Responsive row of filters and actions at the top of a data page. */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="rounded-card border-border-subtle bg-bg-surface shadow-card medium:grid-cols-2 expanded:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] grid grid-cols-1 items-end gap-3 border p-4">
      {children}
    </div>
  );
}
