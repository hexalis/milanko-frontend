"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type SearchTarget = {
  /** id of the archive search box. */
  inputId: string;
  /** The archive URL that focuses the box on arrival. */
  focusHref: string;
};

/** On the archive, focus its search box; anywhere else, open the archive focused (POC openSearch). */
export function useOpenSearch({ inputId, focusHref }: SearchTarget): () => void {
  const router = useRouter();
  return useCallback(() => {
    const input = document.getElementById(inputId);
    if (input) input.focus();
    else router.push(focusHref);
  }, [router, inputId, focusHref]);
}
