"use client";

import { useState } from "react";
import { Button } from "./button";

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = {
  idle: "Copiar enlace",
  copied: "Enlace copiado",
  failed: "No se pudo copiar",
};

const RESET_MS = 2500;

/** Copies the current URL, which already carries the view state. */
export function CopyLinkButton() {
  const [state, setState] = useState<CopyState>("idle");

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), RESET_MS);
  }

  return (
    <Button intent="secondary" onClick={handleClick}>
      <span aria-live="polite">{LABELS[state]}</span>
    </Button>
  );
}
