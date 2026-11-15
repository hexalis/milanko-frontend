"use client";

import { Avatar } from "@hexalis/design-system";

/*
 * Client boundary for the design-system parts the team cards need (see shared/ui/hexalis.ts):
 * Avatar keeps its image status in React state, so Server Components render it through here.
 */

export const AvatarRoot = Avatar;
export const AvatarFallback = Avatar.Fallback;
