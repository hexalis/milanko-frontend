"use client";

import { useEffect, useEffectEvent } from "react";
import { shortcutFor } from "../domain/shortcuts";
import { useNavCollapse } from "../hooks/use-nav-collapse";
import { useOpenSearch } from "../hooks/use-open-search";

type ShellShortcutsProps = { searchInputId: string; searchFocusHref: string };

/** "/" searches the case files and "[" collapses the rail, except while typing. Renders nothing. */
export function ShellShortcuts({ searchInputId, searchFocusHref }: ShellShortcutsProps) {
  const openSearch = useOpenSearch({ inputId: searchInputId, focusHref: searchFocusHref });
  const { toggle } = useNavCollapse();

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const shortcut = shortcutFor(event);
    if (shortcut === "search") {
      event.preventDefault();
      openSearch();
    } else if (shortcut === "collapse") {
      toggle();
    }
  });

  useEffect(() => {
    const listen = (event: KeyboardEvent) => onKeyDown(event);
    document.addEventListener("keydown", listen);
    return () => document.removeEventListener("keydown", listen);
  }, []);

  return null;
}
