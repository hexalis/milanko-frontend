"use client";

import type { ComponentProps } from "react";
import { useUrlSyncedValue } from "@/shared/hooks/use-url-synced-value";

type ArchiveSearchInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  /** The query currently in the URL. */
  urlValue: string;
};

/** Search box that follows the URL when a chip or "clear" link removes the query. */
export function ArchiveSearchInput({ urlValue, ...props }: ArchiveSearchInputProps) {
  const [value, setValue] = useUrlSyncedValue(urlValue);
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      {...props}
    />
  );
}
