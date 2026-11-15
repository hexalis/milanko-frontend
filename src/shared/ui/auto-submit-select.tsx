"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { Select } from "./field";

/** A select that submits its form as soon as the value changes. */
export function AutoSubmitSelect({ onChange, ...props }: ComponentProps<"select">) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange?.(event);
    event.currentTarget.form?.requestSubmit();
  }
  return <Select onChange={handleChange} {...props} />;
}
