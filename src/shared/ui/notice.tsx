import type { ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const notice = tv({
  base: "rounded-card px-4 py-3 text-[15px] font-semibold",
  variants: {
    tone: {
      info: "bg-surface-sky text-ink-soft",
      error: "bg-block-rose text-signal-up",
    },
  },
  defaultVariants: { tone: "info" },
});

type NoticeProps = VariantProps<typeof notice> & { children: ReactNode };

/** Status line for loading results, empty states and errors. */
export function Notice({ tone, children }: NoticeProps) {
  if (tone === "error") {
    return (
      <p className={notice({ tone })} role="alert">
        {children}
      </p>
    );
  }
  return <output className={`block ${notice({ tone })}`}>{children}</output>;
}

/** Placeholder shown while a data section streams in. */
export function LoadingPanel({ label }: { label: string }) {
  return (
    <output className="rounded-card bg-surface/60 text-ink-muted shadow-clay grid min-h-40 place-items-center">
      <span className="animate-pulse font-semibold">{label}</span>
    </output>
  );
}
