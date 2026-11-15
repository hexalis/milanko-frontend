"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { useUrlSyncedValue } from "@/shared/hooks/use-url-synced-value";

type ArchiveSearchInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  /** The query currently in the URL. */
  urlValue: string;
  /** Take the focus on arrival (the shell's search opened the archive with `?focus=1`). */
  shouldFocus?: boolean;
};

/** Search box that follows the URL when a chip or "clear" link removes the query. */
export function ArchiveSearchInput({ urlValue, shouldFocus, ...props }: ArchiveSearchInputProps) {
  const [value, setValue] = useUrlSyncedValue(urlValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus) inputRef.current?.focus();
  }, [shouldFocus]);

  return (
    <input
      ref={inputRef}
      type="search"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      {...props}
    />
  );
}
