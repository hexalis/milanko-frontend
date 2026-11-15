"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { useUrlSyncedValue } from "@/shared/hooks/use-url-synced-value";

type AutoSubmitCheckboxProps = Omit<
  ComponentProps<"input">,
  "type" | "checked" | "defaultChecked"
> & {
  /** Whether the URL currently selects this option. */
  isChecked: boolean;
};

/** A checkbox that submits its form as soon as it is ticked or cleared (POC facets apply at once). */
export function AutoSubmitCheckbox({ isChecked, onChange, ...props }: AutoSubmitCheckboxProps) {
  const [checked, setChecked] = useUrlSyncedValue(isChecked);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setChecked(event.currentTarget.checked);
    onChange?.(event);
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      className="accent-action-primary focus-visible:focus-ring focus-visible:outline-focus-ring size-4 shrink-0 cursor-pointer"
      onChange={handleChange}
      {...props}
    />
  );
}
