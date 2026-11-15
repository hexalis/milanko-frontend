import { tv } from "tailwind-variants";
import { Icon } from "@/shared/ui/icon";
import type { Verdict } from "../domain/case-file";

const stamp = tv({
  base: "inline-flex items-center gap-1.5 rounded-md border-2 px-[11px] py-1 text-[13px] font-semibold whitespace-nowrap",
  variants: {
    verdict: {
      confirmed: "border-status-ok-border bg-status-ok-bg text-text-link",
      // Dashed always means "not proven" (DESIGN.md).
      inconclusive: "border-dashed border-trend-neutral bg-bg-surface-sunken text-trend-neutral",
    },
  },
});

type VerdictStampProps = { verdict: Verdict; label: string };

export function VerdictStamp({ verdict, label }: VerdictStampProps) {
  return (
    <span className={stamp({ verdict })}>
      <Icon name={verdict} size="sm" />
      {label}
    </span>
  );
}
