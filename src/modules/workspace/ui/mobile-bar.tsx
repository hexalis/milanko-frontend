import Link from "next/link";
import type { ReactNode } from "react";
import { MilankoMark, MilankoWordmark } from "@/shared/ui/milanko-logo";

type MobileBarProps = {
  /** Language and theme switches; omitted in the static fallback. */
  children?: ReactNode;
};

/** Phone top bar (POC .mbar): the brand, then the language and theme switches. */
export function MobileBar({ children }: MobileBarProps) {
  return (
    <header className="border-border-subtle bg-bg-surface shadow-raised shell:hidden sticky top-0 z-30 flex h-(--shell-top) items-center justify-between gap-3 border-b px-4">
      <Link
        href="/"
        className="text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring flex items-center gap-2 rounded-md no-underline"
      >
        <MilankoMark size={28} />
        {/* Under 360px the switches need the room: the mark alone stands for the name. */}
        <span className="flex text-[1.1rem] max-[22.5rem]:hidden">
          <MilankoWordmark />
        </span>
        <span className="sr-only">Milanko</span>
      </Link>
      <div data-tour="shell-prefs" className="flex items-center gap-2">
        {children}
      </div>
    </header>
  );
}
