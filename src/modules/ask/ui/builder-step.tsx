import type { ReactNode } from "react";
import { tv } from "tailwind-variants";
import { Icon } from "@/shared/ui/icon";
import type { StepStatus } from "../domain/builder-view";

/*
 * One step of the question builder (POC .qb__step): a fieldset whose legend carries its number,
 * a tick once done, and a dashed note instead of the options while an earlier step is open.
 */

const step = tv({
  slots: {
    legend: "text-heading-h4 m-0 mb-3 flex items-center gap-2.5 p-0 font-bold",
    badge: "grid size-[30px] flex-none place-items-center rounded-full text-label-m font-bold",
  },
  variants: {
    status: {
      current: { legend: "text-text-primary", badge: "bg-bg-inverse text-text-inverse" },
      done: { legend: "text-text-primary", badge: "bg-action-primary text-text-on-primary" },
      locked: { legend: "text-text-secondary", badge: "bg-bg-surface-sunken text-text-secondary" },
    },
  },
});

type BuilderStepProps = {
  n: number;
  label: string;
  status: StepStatus;
  /** What to do first, shown while the step is locked. */
  lockText?: string;
  children: ReactNode;
};

export function BuilderStep({ n, label, status, lockText, children }: BuilderStepProps) {
  const { legend, badge } = step({ status });
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={legend()}>
        <span className={badge()} aria-hidden="true">
          {status === "done" ? <Icon name="check" /> : n}
        </span>
        {label}
      </legend>
      {status === "locked" ? (
        <p className="border-border-default text-text-secondary m-0 rounded-[16px] border-2 border-dashed px-4 py-3.5">
          {lockText}
        </p>
      ) : (
        children
      )}
    </fieldset>
  );
}
