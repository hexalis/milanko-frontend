"use client";

import type { ChangeEvent, ComponentProps, KeyboardEvent, ReactNode } from "react";
import { AutoSubmitSelect } from "@/shared/ui/auto-submit-select";
import { staleSegments, type BuilderSegment } from "../domain/builder";
import { noteArrowKeys, requestFocus } from "./builder-focus";

/**
 * Like the POC (askBindBuilder), changing a segment clears the ones after it: they are disabled for
 * the instant the form is read, so the address carries only what still holds, and empty segments
 * stay out of it. The server validates the rest.
 */
function dropStaleSegments(form: HTMLFormElement | null, segment: BuilderSegment) {
  if (!form) return;
  const stale = new Set<string>(staleSegments(segment));
  const skipped = Array.from(form.elements).filter(
    (element): element is HTMLInputElement | HTMLSelectElement =>
      (element instanceof HTMLSelectElement || element instanceof HTMLInputElement) &&
      !element.disabled &&
      (stale.has(element.name) || element.value === ""),
  );
  for (const element of skipped) element.disabled = true;
  // The submit that follows reads the form synchronously; give the controls back right after.
  queueMicrotask(() => {
    for (const element of skipped) element.disabled = false;
  });
}

type BuilderSegmentSelectProps = Omit<ComponentProps<typeof AutoSubmitSelect>, "name"> & {
  segment: BuilderSegment;
};

/** A long list of options (more than fit as tiles), submitted as soon as it changes. */
export function BuilderSegmentSelect({ segment, ...props }: BuilderSegmentSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    dropStaleSegments(event.currentTarget.form, segment);
  }

  return <AutoSubmitSelect name={segment} onChange={handleChange} {...props} />;
}

type BuilderTileProps = {
  segment: BuilderSegment;
  value: string;
  isChosen: boolean;
  /** The tile's look, from the server component that draws it. */
  className: string;
  children: ReactNode;
};

/** A tile: a label around its radio. Choosing it submits the builder's form (the URL keeps it). */
export function BuilderTile({ segment, value, isChosen, className, children }: BuilderTileProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { form } = event.currentTarget;
    dropStaleSegments(form, segment);
    requestFocus(segment);
    form?.requestSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    noteArrowKeys(event.key.startsWith("Arrow"));
  }

  return (
    <label className={className}>
      <input
        type="radio"
        name={segment}
        value={value}
        defaultChecked={isChosen}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPointerDown={() => noteArrowKeys(false)}
        className="absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[inherit] opacity-0"
      />
      {children}
    </label>
  );
}
