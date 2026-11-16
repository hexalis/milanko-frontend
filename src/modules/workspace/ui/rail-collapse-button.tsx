"use client";

import { Icon } from "@/shared/ui/icon";
import { useNavCollapse } from "../hooks/use-nav-collapse";
import { RailTip } from "./rail-parts";

type RailCollapseButtonProps = { railId: string; collapseLabel: string; expandLabel: string };

/** Opens or collapses the rail; the "[" key does the same (ShellShortcuts). */
export function RailCollapseButton({
  railId,
  collapseLabel,
  expandLabel,
}: RailCollapseButtonProps) {
  const { isCollapsed, toggle } = useNavCollapse();
  // Before mount the state is unknown; the open rail's wording is the safe default.
  const label = isCollapsed ? expandLabel : collapseLabel;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-controls={railId}
      aria-label={label}
      aria-keyshortcuts="["
      className="group/item text-icon-secondary hover:bg-bg-hover hover:text-icon-primary focus-visible:focus-ring focus-visible:outline-focus-ring relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-sm text-lg"
    >
      <Icon name="sidebar" />
      <RailTip label={`${label} · [`} when="always" />
    </button>
  );
}
