"use client";

import type { ChangeEvent, ComponentProps } from "react";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { staleSegments, type BuilderSegment } from "../domain/builder";

type BuilderSegmentSelectProps = Omit<ComponentProps<typeof AutoSubmitSelect>, "name"> & {
  segment: BuilderSegment;
};

/**
 * One segment of the question builder. Like the POC (askBindBuilder), changing a segment clears the
 * ones after it: they are disabled for the instant the form is read, so the address carries only
 * what still holds, and empty segments stay out of it. The server validates the rest.
 */
export function BuilderSegmentSelect({ segment, ...props }: BuilderSegmentSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const stale = new Set<string>(staleSegments(segment));
    const skipped = Array.from(form.elements).filter(
      (element): element is HTMLSelectElement =>
        element instanceof HTMLSelectElement &&
        !element.disabled &&
        (stale.has(element.name) || element.value === ""),
    );
    for (const element of skipped) element.disabled = true;
    // The submit that follows reads the form synchronously; give the controls back right after.
    queueMicrotask(() => {
      for (const element of skipped) element.disabled = false;
    });
  }

  return <AutoSubmitSelect name={segment} onChange={handleChange} {...props} />;
}
