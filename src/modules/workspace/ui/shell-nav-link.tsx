"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { activeSection, type SectionHref } from "../domain/sections";

type ShellNavLinkProps = { href: SectionHref; className: string; children: ReactNode };

/** A shell destination; it is `aria-current="page"` on its section and the pages under it. */
export function ShellNavLink({ href, className, children }: ShellNavLinkProps) {
  const isActive = activeSection(usePathname()) === href;
  return (
    <Link href={href} className={className} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
