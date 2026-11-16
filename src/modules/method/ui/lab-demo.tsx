"use client";

import { Icon } from "@/shared/ui/icon";
import type { DemoCursor } from "../hooks/use-lab-demo";

/* The pieces every lab demo shares: the pointer that drags the sliders, and the bar above the
 * controls that says "your turn" once it hands over and offers to play it again. */

/** The demo's pointer: an arrow that presses down while it drags. */
export function DemoPointer({ cursor }: { cursor: DemoCursor }) {
  return (
    <span
      aria-hidden="true"
      className="ease-standard pointer-events-none absolute top-0 left-0 z-20 transition-[translate] duration-500"
      style={{
        translate: `${cursor.x - 4}px ${cursor.y - 3}px`,
        transitionDuration: cursor.isDragging ? "0ms" : undefined,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-7 drop-shadow-[0_2px_4px_rgb(0_0_0/0.35)] transition-[scale] duration-150 ${cursor.isDown ? "scale-90" : "scale-100"}`}
      >
        <path
          d="M4 2.5 19 12l-6.6 1.4L16 21l-2.9 1.3-3.6-7.6L4 19.5z"
          fill="white"
          stroke="black"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`border-action-primary absolute -top-2 -left-2 size-5 rounded-full border-2 transition-[opacity,scale] duration-200 ${cursor.isDown ? "scale-100 opacity-70" : "scale-50 opacity-0"}`}
      />
    </span>
  );
}

type DemoBarProps = { isTurn: boolean; onReplay: () => void; turn: string; replay: string };

export function DemoBar({ isTurn, onReplay, turn, replay }: DemoBarProps) {
  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
      {isTurn ? (
        <p className="animate-enter rounded-chip bg-action-selected text-label-m text-text-primary inline-flex items-center gap-2 px-3 py-1.5 font-semibold">
          <span className="bg-action-primary size-2 animate-pulse rounded-full" />
          {turn}
        </p>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onReplay}
        className="text-label-s text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-sm font-semibold hover:underline"
      >
        <Icon name="sparkle" size="sm" />
        {replay}
      </button>
    </div>
  );
}
