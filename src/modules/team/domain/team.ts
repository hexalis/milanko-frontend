import type { Locale } from "@/shared/lib/i18n";
import teamData from "../data/team.json";

/*
 * The people who built the portal (POC app.js memberCard / memberLinks, L2805-2840).
 * team.json writes names, roles and bios as a plain string or as { en, es }.
 */

type Localized = string | Partial<Record<Locale, string>>;

type TeamLinkRecord = { type: string; url: string };

export type TeamMemberRecord = {
  name: Localized;
  lead?: boolean;
  placeholder?: boolean;
  roles?: Localized[];
  role?: Localized;
  bio?: Localized;
  affiliation?: string;
  location?: string;
  photo?: string;
  links?: TeamLinkRecord[];
  link?: string;
};

const TEAM_LINK_TYPES = ["linkedin", "github", "web", "email"] as const;
export type TeamLinkType = (typeof TEAM_LINK_TYPES)[number];

export type TeamLink = { type: TeamLinkType; href: string };

export type TeamMember = {
  name: string;
  initials: string;
  isLead: boolean;
  isPlaceholder: boolean;
  roles: string[];
  bio: string;
  /** Affiliation and location, joined. */
  meta: string;
  links: TeamLink[];
};

const EMAIL = /^[^@\s]+@[^@\s]+$/;
const MAX_INITIALS = 2;

export function localize(value: Localized | undefined, locale: Locale): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || "";
}

export function memberInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0] ?? "")
    .slice(0, MAX_INITIALS)
    .join("")
    .toUpperCase();
}

function isTeamLinkType(value: string): value is TeamLinkType {
  return (TEAM_LINK_TYPES as readonly string[]).includes(value);
}

/** Only https links and well-formed addresses reach the page (POC safeUrl). */
export function safeLink({ type, url }: TeamLinkRecord): TeamLink | null {
  if (!isTeamLinkType(type)) return null;
  if (type === "email") return EMAIL.test(url) ? { type, href: `mailto:${url}` } : null;
  return /^https:\/\//.test(url) ? { type, href: url } : null;
}

function toMember(record: TeamMemberRecord, locale: Locale): TeamMember {
  const name = localize(record.name, locale);
  const roles = record.roles ?? (record.role ? [record.role] : []);
  const links = [
    ...(record.links ?? []),
    ...(record.link ? [{ type: "web", url: record.link }] : []),
  ];
  return {
    name,
    initials: memberInitials(name),
    isLead: Boolean(record.lead),
    isPlaceholder: Boolean(record.placeholder),
    roles: roles.map((role) => localize(role, locale)).filter(Boolean),
    bio: localize(record.bio, locale),
    meta: [record.affiliation, record.location].filter(Boolean).join(" · "),
    links: links.flatMap((link) => safeLink(link) ?? []),
  };
}

const TEAM_RECORDS: readonly TeamMemberRecord[] = teamData.members;

/** The lead first, then everyone in the order of team.json. */
export function teamMembers(
  locale: Locale,
  records: readonly TeamMemberRecord[] = TEAM_RECORDS,
): TeamMember[] {
  return records
    .map((record) => toMember(record, locale))
    .toSorted((a, b) => Number(b.isLead) - Number(a.isLead));
}
