"use client";

import { Accordion, Tabs, Toggletip } from "@hexalis/design-system";

/*
 * Client boundary for the design-system parts the case-file dossier needs, in the style of
 * shared/ui/hexalis.ts: React Aria components ship without "use client", and Server Components
 * cannot dot into a client module, so the compound parts are re-exported under flat names.
 * Pass only serializable props (strings, ids, React nodes) across this boundary.
 */

export const TabsRoot = Tabs;
export const TabsList = Tabs.List;
export const TabsTab = Tabs.Tab;
export const TabsPanel = Tabs.Panel;

export const ToggletipRoot = Toggletip;
export const ToggletipTrigger = Toggletip.Trigger;
export const ToggletipContent = Toggletip.Content;

export const AccordionRoot = Accordion;
export const AccordionItem = Accordion.Item;
export const AccordionTrigger = Accordion.Trigger;
export const AccordionPanel = Accordion.Panel;
