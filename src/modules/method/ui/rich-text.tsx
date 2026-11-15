import type { ReactNode } from "react";

const STRONG = /<strong>(.*?)<\/strong>/g;

/**
 * A few POC messages mark their key figure with <strong> ("method.rare.result"). The copy is ours,
 * but it is still rendered as text: only that one tag becomes an element, nothing is parsed as HTML.
 */
export function RichText({ text }: { text: string }): ReactNode {
  const parts = text.split(STRONG);
  // split() with a capture group alternates plain text and the captured strong text.
  return parts.map((part, index) =>
    index % 2 ? <strong key={`${index}-${part}`}>{part}</strong> : part,
  );
}
