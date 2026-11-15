"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { useUrlSyncedValue } from "@/shared/hooks/use-url-synced-value";
import { Select } from "./field";

type AutoSubmitSelectProps = Omit<ComponentProps<"select">, "value" | "defaultValue"> & {
  /** The value currently in the URL; the select follows it when links change the URL. */
  urlValue: string;
};

/** A select that submits its form as soon as the value changes. */
export function AutoSubmitSelect({ urlValue, onChange, ...props }: AutoSubmitSelectProps) {
  const [value, setValue] = useUrlSyncedValue(urlValue);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setValue(event.currentTarget.value);
    onChange?.(event);
    event.currentTarget.form?.requestSubmit();
  }

  return <Select value={value} onChange={handleChange} {...props} />;
}
