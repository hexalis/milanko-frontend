"use client";

import { useEffect, useEffectEvent, type ReactNode, type RefObject } from "react";
import { Icon } from "@/shared/ui/icon";
import { DRAWER_TITLE_ID } from "./drawer-parts";

/**
 * Side panel from this width up, bottom sheet below (the POC's wideDrawer, without its rule for
 * phones held sideways). Matches the min-[860px] classes below.
 */
const WIDE_DRAWER = "(min-width: 860px)";
/** Room left between a side panel and what the globe centres (the POC's offsetWidth + 16). */
const SIDE_GAP_PX = 16;

type ExploreDrawerProps = {
  drawerRef: RefObject<HTMLElement | null>;
  closeLabel: string;
  onClose: () => void;
  /** How much of the frame the drawer covers, so the globe keeps the selection in the free space. */
  onInset: (side: "right" | "bottom", px: number) => void;
  /**
   * Held back while the globe is still loading: a link that opens a case renders its panel on the
   * server, and it would otherwise sit over the loader. It stays in the page, hidden and inert,
   * and slides in once the world has appeared.
   */
  isHeld?: boolean;
  children: ReactNode;
};

const PRESENCE = {
  held: "pointer-events-none opacity-0 max-[859px]:translate-y-6 min-[860px]:translate-x-6",
  shown:
    "opacity-100 transition-[opacity,translate] delay-700 duration-500 ease-out motion-reduce:transition-none",
} as const;

export function ExploreDrawer({
  drawerRef,
  closeLabel,
  onClose,
  onInset,
  isHeld = false,
  children,
}: ExploreDrawerProps) {
  const report = useEffectEvent(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (window.matchMedia(WIDE_DRAWER).matches) onInset("right", drawer.offsetWidth + SIDE_GAP_PX);
    else onInset("bottom", drawer.offsetHeight);
  });

  // Rotating a phone or resizing the window swaps side panel and sheet, and new content resizes it.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || typeof ResizeObserver === "undefined") return;
    const wide = window.matchMedia(WIDE_DRAWER);
    const onChange = () => report();
    const observer = new ResizeObserver(onChange);
    observer.observe(drawer);
    wide.addEventListener("change", onChange);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", onChange);
    };
  }, [drawerRef]);

  return (
    <aside
      ref={drawerRef}
      data-tour="exp-drawer"
      aria-labelledby={DRAWER_TITLE_ID}
      inert={isHeld}
      className={`${isHeld ? PRESENCE.held : PRESENCE.shown} border-border-subtle bg-bg-surface shadow-raised scrollbar-milanko absolute inset-x-0 bottom-0 z-10 flex max-h-[60%] scroll-py-24 flex-col overflow-y-auto overscroll-contain rounded-t-[22px] border p-5 min-[860px]:inset-x-auto min-[860px]:top-3 min-[860px]:right-3 min-[860px]:bottom-3 min-[860px]:max-h-none min-[860px]:w-[400px] min-[860px]:rounded-[22px] [&>:last-child]:flex-1`}
    >
      {/*
       * Pinned to the top corner while the panel scrolls, over the panel's sticky head
       * (PanelHead): 12px from the edges, and the negative margins take it out of the flow.
       */}
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="rounded-control text-text-secondary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring sticky -top-2 z-[3] -me-2 -mt-2 -mb-8 inline-flex size-10 shrink-0 items-center justify-center self-end"
      >
        <Icon name="x" />
      </button>
      {/* The panel fills the drawer's height, so its footer (Actions) sits at the bottom. */}
      {children}
    </aside>
  );
}
