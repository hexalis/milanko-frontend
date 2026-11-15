import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

/*
 * Pieces shared by the home's two night blocks (POC .block--night .hm-hero / .hm-close): deep
 * space in both themes with a few fixed stars, and the light "glow" button that sits on it.
 */

// Fixed stars, drawn once. They do not twinkle.
const STARS: CSSProperties = {
  backgroundImage: [
    "radial-gradient(1px 1px at 12% 18%, #fff 50%, transparent 51%)",
    "radial-gradient(1px 1px at 28% 72%, #ffffffaa 50%, transparent 51%)",
    "radial-gradient(1.4px 1.4px at 46% 12%, #ffffffcc 50%, transparent 51%)",
    "radial-gradient(1px 1px at 63% 84%, #ffffff99 50%, transparent 51%)",
    "radial-gradient(1.2px 1.2px at 78% 26%, #fff 50%, transparent 51%)",
    "radial-gradient(1px 1px at 91% 64%, #ffffffaa 50%, transparent 51%)",
    "radial-gradient(1px 1px at 6% 88%, #ffffff88 50%, transparent 51%)",
    "radial-gradient(1.3px 1.3px at 38% 44%, #ffffff77 50%, transparent 51%)",
    "radial-gradient(1px 1px at 55% 58%, #ffffff66 50%, transparent 51%)",
    "radial-gradient(1px 1px at 84% 92%, #ffffffaa 50%, transparent 51%)",
    "radial-gradient(1px 1px at 70% 8%, #ffffff88 50%, transparent 51%)",
    "radial-gradient(1.2px 1.2px at 22% 36%, #ffffffbb 50%, transparent 51%)",
  ].join(", "),
};

export function Stars() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={STARS} />
  );
}

const GLOW = [
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-control border border-white/30 px-5",
  "text-label-l font-semibold text-white no-underline transition-[background-color,border-color,scale] duration-fast",
  "hover:border-white/60 hover:bg-white/10 active:scale-[0.97] motion-reduce:active:scale-100",
  "focus-visible:focus-ring focus-visible:outline-focus-ring max-medium:w-full",
].join(" ");

/** A light outline button for the night blocks. */
export function GlowLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={GLOW}>
      <Icon name={icon} />
      {children}
    </Link>
  );
}
