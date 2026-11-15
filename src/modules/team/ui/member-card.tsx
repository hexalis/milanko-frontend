import Image from "next/image";
import { tv, type VariantProps } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import type { TeamLink, TeamLinkType, TeamMember } from "../domain/team";
import { AvatarFallback, AvatarImage, AvatarRoot } from "./hexalis-team";

/*
 * One person (POC memberCard, DESIGN.md · Team): their photo filling the frame (initials on a
 * tinted frame when there is none), an eyebrow for the
 * lead or a seat still to confirm, the name, every role as a pill, a bio and the links.
 * The card itself is not a link; only its buttons react. `compact` is the method page's aside.
 */

const card = tv({
  slots: {
    root: "min-w-0",
    frame: "relative grid place-items-center overflow-hidden",
    body: "flex min-w-0 flex-col gap-2",
    name: "font-display text-text-primary text-balance",
    roles: "flex flex-wrap gap-1.5",
    role: "rounded-chip bg-surface-tone-1 text-label-m text-text-primary px-2.5 py-0.5",
    links: "flex flex-wrap items-center gap-2",
  },
  variants: {
    layout: {
      grid: {
        root: "rounded-card bg-bg-surface shadow-card flex flex-col overflow-hidden",
        frame: "bg-surface-tone-3 aspect-[4/3] medium:aspect-square",
        body: "p-4 medium:p-5",
        name: "text-heading-h3",
        links: "mt-auto pt-2",
      },
      compact: {
        root: "border-border-subtle grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b py-3 last:border-b-0",
        body: "gap-1",
        name: "text-body-m-strong",
      },
    },
  },
  defaultVariants: { layout: "grid" },
});

type CardLayout = NonNullable<VariantProps<typeof card>["layout"]>;

const LINK_ICONS: Record<TeamLinkType, string> = {
  linkedin: "linkedin",
  github: "github",
  web: "link",
  email: "link",
};

const ICON_LINK =
  "inline-grid size-touch-min place-items-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary no-underline transition-colors duration-fast hover:border-border-strong hover:text-text-brand focus-visible:focus-ring focus-visible:outline-focus-ring";

type MemberLinkProps = {
  link: TeamLink;
  name: string;
  layout: CardLayout;
  translator: Translator;
};

function MemberLink({ link, name, layout, translator: { t } }: MemberLinkProps) {
  const site = t(`team.link.${link.type}`);
  const isPill = link.type === "linkedin" && layout === "grid";
  if (link.type === "email") {
    // Mail opens the reader's own app, not a new tab.
    return (
      <a href={link.href} className={ICON_LINK} aria-label={`${name} · ${site}`}>
        <Icon name={LINK_ICONS.email} />
      </a>
    );
  }
  return (
    <ExternalLink
      href={link.href}
      className={isPill ? buttonLink({ intent: "secondary" }) : ICON_LINK}
      // An aria-label replaces the whole name, so it carries the new-tab hint itself.
      aria-label={`${t("team.link.of", { site, name })} ${t("link.newTab")}`}
      newTabHint={t("link.newTab")}
    >
      <Icon name={LINK_ICONS[link.type]} />
      {isPill ? site : null}
    </ExternalLink>
  );
}

function Eyebrow({ member, translator: { t } }: { member: TeamMember; translator: Translator }) {
  if (member.isLead) {
    return (
      <p className="text-label-m text-text-brand flex items-center gap-1.5">
        <Icon name="sparkle" size="sm" />
        {t("team.leadBadge")}
      </p>
    );
  }
  if (member.isPlaceholder) {
    return (
      <p className="rounded-chip border-border-strong text-label-m text-text-secondary self-start border border-dashed px-2.5 py-0.5">
        {t("team.pending")}
      </p>
    );
  }
  return null;
}

type MemberCardProps = {
  member: TeamMember;
  translator: Translator;
  layout?: CardLayout;
};

export function MemberCard({ member, translator, layout = "grid" }: MemberCardProps) {
  const slots = card({ layout });
  const isGrid = layout === "grid";
  return (
    <li className={slots.root()}>
      <div className={slots.frame()}>
        {/* The name sits right beside the picture, so the picture stays hidden from assistive tech. */}
        {isGrid && member.photo ? (
          <Image
            src={member.photo}
            alt=""
            fill
            sizes="(min-width: 840px) 320px, 100vw"
            className="object-cover"
          />
        ) : (
          <AvatarRoot size={isGrid ? "xl" : "m"} tone="brand">
            {member.photo ? <AvatarImage src={member.photo} alt="" /> : null}
            {/* Without initials (a seat to confirm) the fallback shows a person icon. */}
            <AvatarFallback>{member.isPlaceholder ? undefined : member.initials}</AvatarFallback>
          </AvatarRoot>
        )}
      </div>
      <div className={slots.body()}>
        <Eyebrow member={member} translator={translator} />
        <h3 className={slots.name()}>{member.name}</h3>
        {member.roles.length ? (
          <ul className={slots.roles()} aria-label={translator.t("team.roles")}>
            {member.roles.map((role) => (
              <li key={role} className={slots.role()}>
                {role}
              </li>
            ))}
          </ul>
        ) : null}
        {isGrid && member.bio ? (
          <p className="text-body-m text-text-secondary">{member.bio}</p>
        ) : null}
        {isGrid && member.meta ? (
          <p className="text-body-s text-text-tertiary">{member.meta}</p>
        ) : null}
        {member.links.length ? (
          <div className={slots.links()}>
            {member.links.map((link) => (
              <MemberLink
                key={link.href}
                link={link}
                name={member.name}
                layout={layout}
                translator={translator}
              />
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
