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
 * renders until mounted, nor when the trail is empty; short or collapsed rails leave it out.
 */
export function RailRecent({ heading, titles }: RailRecentProps) {
  const headingId = useId();
  const progress = useCaseProgress();
  const files = progress ? recentFiles(progress.recent, titles) : [];
  if (files.length === 0) return null;

  return (
    <div className="nav-collapsed:hidden mt-3 [@media(max-height:700px)]:hidden">
      <p id={headingId} className="text-overline text-text-tertiary px-3 pb-1">
        {heading}
      </p>
      <ul aria-labelledby={headingId} className="flex flex-col gap-0.5">
        {files.map((file) => (
          <li key={file.id}>
            <Link
              href={`/cases/${file.id}`}
              title={file.title}
              className="text-label-s text-text-secondary hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring flex min-h-10 items-center gap-2.5 rounded-md px-3 py-1 no-underline"
            >
              <span aria-hidden="true" className="bg-icon-brand size-2 shrink-0 rounded-full" />
              <span className="line-clamp-2 min-w-0">{file.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
