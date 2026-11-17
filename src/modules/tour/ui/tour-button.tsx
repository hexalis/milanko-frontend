"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { presentSteps, tourSelector, type TourLabels, type TourStep } from "../domain/tours";
import { alignToTop, fitTarget, topCover } from "./fit-target";

/*
 * "How does this page work?": starts the page's tour, never on its own. driver.js loads on the
 * first press. Each step goes to the element of its target that is on screen (the rail and the
 * phone bar both carry the language switch); a step with none is skipped, and one too tall to share
 * the screen with the popover points at a part that fits (fit-target.ts). The popover takes the
 * focus, Esc closes it and the focus comes back to this button. Its styles (driver.js's and
 * tour.css) are imported by app/globals.css, since the popover lives outside React.
 */

/*
 * Compact: only the icon shows, and the label unfolds beside it while the button is hovered or
 * focused from the keyboard (React Aria's data-hovered and data-focus-visible). The label stays in
 * the accessibility tree, so the button keeps its name; touch screens start the tour on the tap.
 */
const COMPACT_LABEL = [
  "inline-block max-w-0 overflow-hidden whitespace-nowrap opacity-0",
  "transition-[max-width,opacity,padding] duration-200 ease-out motion-reduce:transition-none",
  "group-data-hovered/button:max-w-60 group-data-hovered/button:ps-1.5 group-data-hovered/button:opacity-100",
  "group-data-focus-visible/button:max-w-60 group-data-focus-visible/button:ps-1.5 group-data-focus-visible/button:opacity-100",
].join(" ");

/*
 * Floating (every page but the globe): a small pill in the bottom corner, out of the page's flow,
 * so the page opens on its own content. With the rail (shell) it reads "How does this page work?";
 * on a phone it sits above the tab bar as a round icon whose label unfolds on keyboard focus.
 */
const FLOATING = [
  "fixed end-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 min-h-11 min-w-11 gap-0 rounded-full px-3 shadow-dropdown print:hidden",
  "shell:end-6 shell:bottom-6",
].join(" ");
const FLOATING_LABEL = `${COMPACT_LABEL} shell:max-w-60 shell:ps-1.5 shell:opacity-100`;

type TourButtonProps = {
  steps: TourStep[];
  /** Icon only, the label unfolding on hover or keyboard focus (over the globe, in a lesson). */
  isCompact?: boolean;
  /** Shown alone while none of the steps is on screen yet (the globe still loading). */
  wait?: TourStep;
  labels: TourLabels;
};

function onScreen(target: string): Element | undefined {
  return Array.from(document.querySelectorAll(tourSelector(target))).find(
    (element) => element.getClientRects().length > 0,
  );
}

export function TourButton({ steps, isCompact = false, wait, labels }: TourButtonProps) {
  const id = useId();
  const [isStarting, setIsStarting] = useState(false);

  async function handlePress() {
    setIsStarting(true);
    try {
      const { driver } = await import("driver.js");
      const shown = presentSteps(steps, onScreen);
      const isWaiting = !shown.length && wait !== undefined;
      const found = isWaiting ? presentSteps([wait], onScreen) : shown;
      if (!found.length) return;
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      driver({
        steps: found.map(({ step, element }) => {
          // The wait step speaks over the whole (still empty) globe: nothing there to keep clear.
          const fit = isWaiting
            ? { element, align: "center" }
            : fitTarget(element, window.innerHeight, topCover(element));
          return {
            element: fit.element,
            popover: { title: step.title, description: step.text },
            onHighlightStarted: fit.align === "start" ? () => alignToTop(fit.element) : undefined,
          };
        }),
        animate: !isReduced,
        smoothScroll: !isReduced,
        focus: "popover",
        showProgress: found.length > 1,
        progressText: labels.progress,
        nextBtnText: labels.next,
        prevBtnText: labels.previous,
        doneBtnText: labels.done,
        closeBtnLabel: labels.close,
        popoverClass: "milanko-tour",
        stageRadius: 12,
        onDestroyed: () => document.getElementById(id)?.focus(),
      }).drive();
    } finally {
      setIsStarting(false);
    }
  }

  if (isCompact) {
    return (
      <Button
        id={id}
        intent="ghost"
        size="s"
        isPending={isStarting}
        onPress={handlePress}
        className="min-h-[46px] min-w-[46px] justify-center gap-0 rounded-full px-2.5"
      >
        <Icon name="info" size="lg" />
        <span className={COMPACT_LABEL}>{labels.open}</span>
      </Button>
    );
  }

  return (
    <Button
      id={id}
      intent="secondary"
      size="s"
      isPending={isStarting}
      onPress={handlePress}
      className={FLOATING}
    >
      <Icon name="info" size="lg" />
      <span className={FLOATING_LABEL}>{labels.open}</span>
    </Button>
  );
}
