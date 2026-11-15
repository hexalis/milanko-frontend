"use client";

import { usePathname } from "next/navigation";
import type { SectionLabels } from "../domain/sections";
import { WorkspaceNavLinks } from "./workspace-nav-links";

type WorkspaceNavProps = { labels: SectionLabels; menuLabel: string };

/** Marks the current section; render it inside Suspense because the pathname is runtime data. */
export function WorkspaceNav({ labels, menuLabel }: WorkspaceNavProps) {
  return <WorkspaceNavLinks labels={labels} menuLabel={menuLabel} pathname={usePathname()} />;
}
