import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";

/*
 * The light "glow" button of the home's two night blocks (POC .block--night .hm-hero / .hm-close),
 * which sit on deep space in both themes (the sky itself is home-sky.tsx).
 */

const GLOW = [
  "inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-control border border-white/30 bg-white/[0.04] px-5 backdrop-blur-sm",
  "text-label-l font-semibold text-white no-underline transition-[background-color,border-color,scale] duration-fast",
  "hover:border-white/60 hover:bg-white/12 active:scale-[0.97] motion-reduce:active:scale-100",
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
