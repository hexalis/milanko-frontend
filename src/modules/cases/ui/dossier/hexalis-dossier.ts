"use client";

import { Toggletip } from "@hexalis/design-system";

/*
 * Client boundary for the design-system parts the case files need, in the style of
 * shared/ui/hexalis.ts: React Aria components ship without "use client", and Server Components
 * cannot dot into a client module, so the compound parts are re-exported under flat names.
 * Pass only serializable props (strings, ids, React nodes) across this boundary.
 */

export const ToggletipRoot = Toggletip;
export const ToggletipTrigger = Toggletip.Trigger;
export const ToggletipContent = Toggletip.Content;
