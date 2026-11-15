"use client";

import { useSyncExternalStore } from "react";

type CitationProps = {
  id: string;
  /** Lines as written on the server; `{today}` is the reader's own date, the last line the page path. */
  lines: string[];
};

const subscribe = () => () => {};

/** The reader's own date, not the UTC one: in the Americas the two differ every evening. */
function readerToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * The citation block (POC cf-cite). Its date and full address are the reader's, so they are filled
 * in the browser; the server render shows the bare path and a dash for the date.
 */
export function Citation({ id, lines }: CitationProps) {
  const today = useSyncExternalStore(subscribe, readerToday, () => null);
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
  const path = lines.at(-1) ?? "";
  const body = lines.slice(0, -1).map((line) => line.replace("{today}", today ?? "—"));
  return (
    <pre
      id={id}
      className="rounded-field border-border-subtle bg-bg-surface-sunken text-text-primary mt-3 border p-3 font-mono text-[12.5px] leading-relaxed break-words whitespace-pre-wrap"
    >
      {[...body, `${origin}${path}`].join("\n")}
    </pre>
  );
}
