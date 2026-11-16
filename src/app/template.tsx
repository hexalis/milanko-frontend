import type { ReactNode } from "react";

/*
 * A template mounts anew on every navigation, so each page arrives with the same short fade
 * (globals.css --animate-page) instead of a hard cut. Reduced motion ends it at once.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
