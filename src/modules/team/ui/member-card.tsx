import Image from "next/image";
import { withBasePath } from "@/shared/lib/base-path";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import type { TeamLink, TeamLinkType, TeamMember } from "../domain/team";
import { AvatarFallback, AvatarRoot } from "./hexalis-team";

/*
 * One person as a case-file card (the portal's own language): a small framed portrait beside
 * the folio ("File 01 · Lead"), then the name and every role on the card's full width (so a long
 * name never squeezes into a column), and the links in a foot of their own, so every card in a
 * row lines up. The card itself is not a link; only its links react.
 */

const LINK_ICONS: Record<TeamLinkType, string> = {
  linkedin: "linkedin",
  github: "github",
  web: "link",
  email: "link",
};

const LINK =
  "inline-flex min-h-touch-min items-center gap-1.5 rounded-sm text-label-m font-semibold text-text-brand no-underline hover:underline focus-visible:focus-ring focus-visible:outline-focus-ring";

type MemberLinkProps = { link: TeamLink; name: string; translator: Translator };

function MemberLink({ link, name, translator: { t } }: MemberLinkProps) {
  const site = t(`team.link.${link.type}`);
  if (link.type === "email") {
    // Mail opens the reader's own app, not a new tab.
    return (
      <a href={link.href} className={LINK} aria-label={`${name} · ${site}`}>
        <Icon name={LINK_ICONS.email} />
        {site}
      </a>
    );
  }
  return (
    <ExternalLink
      href={link.href}
      className={LINK}
      // An aria-label replaces the whole name, so it carries the new-tab hint itself.
      aria-label={`${t("team.link.of", { site, name })} ${t("link.newTab")}`}
      newTabHint={t("link.newTab")}
    >
      <Icon name={LINK_ICONS[link.type]} />
      {site}
    </ExternalLink>
  );
}

type MemberCardProps = {
  member: TeamMember;
  /** 1-based place in the list, printed as the card's folio. */
  folio: number;
  translator: Translator;
};

export function MemberCard({ member, folio, translator }: MemberCardProps) {
  const { t } = translator;
  const number = String(folio).padStart(2, "0");
  const tag = member.isLead ? t("team.leadBadge") : member.isPlaceholder ? t("team.pending") : null;
  return (
    <li className="group/member rounded-card bg-bg-surface shadow-card duration-fast hover:shadow-dropdown flex min-w-0 flex-col transition-[box-shadow,translate] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="grid min-w-0 gap-3 p-5">
        <div className="flex items-center gap-3">
          {/* The name sits right under the picture, so the picture stays hidden from assistive tech. */}
          <div className="bg-surface-tone-3 ring-border-subtle shadow-card relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl ring-1">
            {member.photo ? (
              <Image
                src={withBasePath(member.photo)}
                alt=""
                fill
                sizes="64px"
                className="duration-base object-cover object-[50%_25%] transition-[scale] group-hover/member:scale-105 motion-reduce:transition-none"
              />
            ) : (
              <AvatarRoot size="xl" tone="brand">
                {/* Without initials (a seat to confirm) the fallback shows a person icon. */}
                <AvatarFallback>{member.isPlaceholder ? undefined : member.initials}</AvatarFallback>
              </AvatarRoot>
            )}
          </div>
          <p className="text-label-xs text-text-tertiary flex flex-col gap-0.5 font-mono tracking-wide uppercase">
            {t("team.folio", { n: number })}
            {tag ? (
              <span className={member.isLead ? "text-text-brand" : undefined}>
                {/* Stacked under the folio, the separator only reads aloud. */}
                <span className="sr-only"> · </span>
                {tag}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-heading-h4 text-text-primary leading-snug text-balance">
            {member.name}
          </h3>
          {member.roles.length ? (
            <ul
              className="text-body-s text-text-secondary flex flex-wrap gap-x-2"
              aria-label={t("team.roles")}
            >
              {member.roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
          ) : null}
          {member.bio ? <p className="text-body-s text-text-secondary">{member.bio}</p> : null}
          {member.meta ? <p className="text-body-s text-text-tertiary">{member.meta}</p> : null}
        </div>
      </div>
      {member.links.length ? (
        <div className="border-border-subtle mt-auto flex flex-wrap items-center gap-x-4 border-t px-5 py-1">
          {member.links.map((link) => (
            <MemberLink key={link.href} link={link} name={member.name} translator={translator} />
          ))}
        </div>
      ) : null}
    </li>
  );
}
