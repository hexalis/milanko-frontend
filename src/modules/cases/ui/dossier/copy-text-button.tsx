"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";

type CopyState = "idle" | "copied";

const RESET_MS = 2200;

type CopyTextButtonProps = {
  /** Text to copy; the page's own address when left out ("Copy link"). */
  text?: string;
  /** Element whose text is copied, for text completed in the browser (the citation). */
  sourceId?: string;
  labels: { idle: string; copied: string };
  intent?: "primary" | "secondary";
};

function textToCopy({ text, sourceId }: Pick<CopyTextButtonProps, "text" | "sourceId">): string {
  if (sourceId) return document.getElementById(sourceId)?.textContent?.trim() ?? "";
  return text ?? window.location.href;
}

/** Copies a sentence, the citation or the page link, and says so in place (POC data-copy, toast). */
export function CopyTextButton({
  text,
  sourceId,
  labels,
  intent = "secondary",
}: CopyTextButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  async function handlePress() {
    try {
      await navigator.clipboard.writeText(textToCopy({ text, sourceId }));
      setState("copied");
    } catch {
      // No clipboard (an insecure origin or a denied permission): the text stays on the page to select.
      setState("idle");
      return;
    }
    window.setTimeout(() => setState("idle"), RESET_MS);
  }

  return (
    <Button intent={intent} onPress={handlePress}>
      <span aria-live="polite">{labels[state]}</span>
    </Button>
  );
}
