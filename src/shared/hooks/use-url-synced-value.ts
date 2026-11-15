import { useState } from "react";

/**
 * Local state for a form control whose truth is the URL. The user can change it freely, and it
 * follows the URL again whenever the URL value changes (chips, "clear" links, back/forward)
 * without remounting the control, so keyboard focus stays where it was.
 */
export function useUrlSyncedValue<T>(urlValue: T): [T, (next: T) => void] {
  const [value, setValue] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  if (!Object.is(lastUrlValue, urlValue)) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }
  return [value, setValue];
}
