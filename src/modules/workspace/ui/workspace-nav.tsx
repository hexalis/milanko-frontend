"use client";

import { usePathname } from "next/navigation";
import { WorkspaceNavLinks } from "./workspace-nav-links";

/** Marks the current section; render it inside Suspense because the pathname is runtime data. */
export function WorkspaceNav() {
  return <WorkspaceNavLinks pathname={usePathname()} />;
}
