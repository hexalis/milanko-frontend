import Link from "next/link";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/text-link";

type NextCaseProps = {
  label: string;
  relatedLabel: string;
  next: { href: string; title: string; meta: string };
  links: { href: string; icon: string; label: string }[];
};

/*
 * Night next-case card and the line of related links (POC doc--next). Deferred: the share button
 * and "See on the globe" (no explorer route yet), and View Transitions between folders (data-morph).
 */
export function NextCase({ label, relatedLabel, next, links }: NextCaseProps) {
  return (
    <nav aria-label={relatedLabel} className="flex flex-col gap-5">
      <Link
        href={next.href}
        className="group rounded-shell bg-bg-inverse text-text-inverse shadow-raised duration-fast focus-visible:focus-ring focus-visible:outline-focus-ring medium:p-8 relative flex flex-col gap-1.5 p-6 no-underline transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
      >
        <span className="text-overline opacity-80">{label}</span>
        <span className="text-heading-h3 font-display pr-10 text-balance">{next.title}</span>
        <span className="text-body-s font-mono opacity-80">{next.meta}</span>
        <span className="duration-fast absolute top-1/2 right-6 -translate-y-1/2 transition-transform group-hover:translate-x-1">
          <Icon name="arrow-right" size="lg" />
        </span>
      </Link>
      {links.length ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <li key={link.href} className="inline-flex items-center gap-1.5">
              <Icon name={link.icon} />
              <TextLink href={link.href}>{link.label}</TextLink>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}
