import type { ReactNode } from "react";
import { AlertContent, AlertDescription, AlertToneIcon, InlineAlertRoot } from "./hexalis";

type NoticeProps = {
  tone?: "info" | "error";
  children: ReactNode;
};

/** DS inline alert for results, empty states and errors. Errors are announced. */
export function Notice({ tone = "info", children }: NoticeProps) {
  return (
    <InlineAlertRoot tone={tone === "error" ? "late" : "info"} announce={tone === "error"} size="s">
      <AlertToneIcon />
      <AlertContent>
        <AlertDescription>{children}</AlertDescription>
      </AlertContent>
    </InlineAlertRoot>
  );
}

/** Placeholder shown while a data section streams in. */
export function LoadingPanel({ label }: { label: string }) {
  return (
    <output className="rounded-card border-border-subtle bg-bg-surface/60 text-text-tertiary shadow-card grid min-h-40 place-items-center border">
      <span className="text-body-m-strong animate-pulse">{label}</span>
    </output>
  );
}
