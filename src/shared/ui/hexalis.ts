"use client";

import { Badge, Button as HexalisButton, Card, InlineAlert, Stat } from "@hexalis/design-system";

/*
 * Client boundary for @hexalis/design-system. Its components are built on React Aria (hooks and
 * context) and ship without "use client", so Server Components render them through this module.
 * Server Components cannot dot into a client module (`Card.Title`), and the package only exports
 * the compound namespaces, so the parts are re-exported here under flat names.
 * Add a part when a screen needs it; pass only serializable props across this boundary.
 */

export const Button = HexalisButton;

export const BadgeRoot = Badge;
export const BadgeLabel = Badge.Label;

export const CardRoot = Card;
export const CardHeader = Card.Header;
export const CardHeadings = Card.Headings;
export const CardTitle = Card.Title;
export const CardDescription = Card.Description;
export const CardContent = Card.Content;

export const InlineAlertRoot = InlineAlert;
export const AlertToneIcon = InlineAlert.ToneIcon;
export const AlertContent = InlineAlert.Content;
export const AlertDescription = InlineAlert.Description;

export const StatRoot = Stat;
export const StatLabel = Stat.Label;
export const StatValue = Stat.Value;
export const StatFooter = Stat.Footer;
