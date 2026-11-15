"use client";

import { kbdRecipe } from "@hexalis/components/themes";
import { Icon } from "@/shared/ui/icon";
import { useOpenSearch } from "../hooks/use-open-search";
import { RailTip } from "./rail-parts";

type RailSearchButtonProps = { label: string; inputId: string; focusHref: string };

/** "Search case files" with its "/" key; collapsed, an icon with a tooltip. */
export function RailSearchButton({ label, inputId, focusHref }: RailSearchButtonProps) {
  const openSearch = useOpenSearch({ inputId, focusHref });
  return (
    <button
      type="button"
      onClick={openSearch}
      data-tour="shell-search"
      aria-keyshortcuts="/"
      className="group/item border-border-default bg-bg-surface-sunken text-label-s text-text-secondary hover:border-border-strong hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring nav-collapsed:justify-center nav-collapsed:border-transparent nav-collapsed:bg-transparent nav-collapsed:px-0 relative flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3"
    >
      <span className="text-icon-secondary flex text-lg">
        <Icon name="search" />
      </span>
      <span className="nav-collapsed:sr-only min-w-0 flex-1 truncate text-start">{label}</span>
      <kbd aria-hidden="true" className={`${kbdRecipe()} nav-collapsed:hidden`}>
        /
      </kbd>
      <RailTip label={`${label} · /`} />
    </button>
  );
}
