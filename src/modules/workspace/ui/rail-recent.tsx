"use client";

import Link from "next/link";
import { useId } from "react";
import { recentFiles } from "../domain/case-progress";
import { useCaseProgress } from "../hooks/use-case-progress";

type RailRecentProps = {
  heading: string;
  titles: Readonly<Record<string, string>>;
};

/**
 * The last three case files the reader opened (POC nav__recent). It lives in storage, so nothing
 * renders until mounted, nor when the trail is empty; the collapsed rail leaves it out. It is a
 * section of its own (rule, heading), and a short rail scrolls to it instead of hiding it.
 */
export function RailRecent({ heading, titles }: RailRecentProps) {
  const headingId = useId();
  const progress = useCaseProgress();
  const files = progress ? recentFiles(progress.recent, titles) : [];
  if (files.length === 0) return null;

  return (
    <div
      data-tour="shell-recent"
      className="border-border-default nav-collapsed:hidden mx-3 mt-2 border-t pt-3"
    >
      <p id={headingId} className="text-overline text-text-tertiary pb-1.5">
        {heading}
      </p>
      <ul aria-labelledby={headingId} className="-mx-3 flex flex-col gap-0.5">
        {files.map((file) => (
          <li key={file.id}>
            <Link
              href={`/cases/${file.id}`}
              title={file.title}
              className="text-label-s text-text-secondary hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring rounded-control flex min-h-10 items-center gap-3 px-3 py-1.5 font-semibold no-underline"
            >
              <span
                aria-hidden="true"
                className="bg-icon-brand mx-1.5 size-2 shrink-0 rounded-full"
              />
              <span className="line-clamp-2 min-w-0">{file.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
