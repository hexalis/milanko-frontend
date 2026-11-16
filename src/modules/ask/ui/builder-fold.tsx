"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { takeFocus } from "./builder-focus";

/*
 * A step whose choice is made folds into that one card, with "Change" beside it to open the other
 * options again (POC .qb__fold). Only one fold is open at a time (details sharing a name) and
 * Escape folds it back. It is keyed by the choice, so a new choice mounts it folded.
 */

type BuilderFoldProps = {
  segment: string;
  /** The chosen card, drawn as the summary. */
  summary: ReactNode;
  /** Accessible name of the summary: the step, the choice and "Change". */
  summaryLabel: string;
  children: ReactNode;
};

/*
 * A made choice reads the same whether it can change or not: one row shape, one hairline edge,
 * the choice's icon on its tile, and a pill at the end ("Change", or a quiet "Only option").
 */
export const CHOSEN_ROW =
  "flex min-h-16 items-center gap-3 rounded-[18px] bg-bg-surface py-3 ps-3 pe-3.5 text-body-m font-bold text-text-primary shadow-[inset_0_0_0_1px_var(--color-border-default),0_1px_2px_rgb(0_0_0/0.04)]";

const SUMMARY = [
  CHOSEN_ROW,
  "group/sum cursor-pointer list-none transition-shadow duration-fast",
  "hover:shadow-[inset_0_0_0_1px_var(--color-action-primary)] group-open/fold:shadow-[inset_0_0_0_2px_var(--color-action-primary)]",
  "[&::-webkit-details-marker]:hidden focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

export function BuilderFold({ segment, summary, summaryLabel, children }: BuilderFoldProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const focus = takeFocus(segment);
    if (focus?.isKeyboard) {
      details.open = true;
      details.querySelector<HTMLInputElement>("input:checked")?.focus({ preventScroll: true });
    } else if (focus) {
      details.querySelector("summary")?.focus({ preventScroll: true });
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !details?.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    }
    details.addEventListener("keydown", handleKeyDown);
    return () => details.removeEventListener("keydown", handleKeyDown);
  }, [segment]);

  return (
    <details ref={ref} name="builder-fold" className="group/fold">
      <summary aria-label={summaryLabel} className={SUMMARY}>
        {summary}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
