"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";

type GuidedCopyAnswerProps = {
  /** The sentence and its source line, as copied. */
  text: string;
  /** Id of the element holding the sentence, selected when the clipboard is unavailable. */
  targetId: string;
  labels: { copy: string; copied: string };
};

const RESET_MS = 2500;

/**
 * Copies the verdict sentence (POC #askCopy). When the clipboard is refused, the sentence is
 * selected instead so the reader can copy it by hand (the POC showed it in a toast).
 */
export function GuidedCopyAnswer({ text, targetId, labels }: GuidedCopyAnswerProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), RESET_MS);
    } catch {
      const target = document.getElementById(targetId);
      const selection = window.getSelection();
      if (!target || !selection) return;
      selection.selectAllChildren(target);
    }
  }

  return (
    <Button intent="secondary" onPress={handleCopy}>
      <Icon name="check" />
      <span aria-live="polite">{isCopied ? labels.copied : labels.copy}</span>
    </Button>
  );
}
