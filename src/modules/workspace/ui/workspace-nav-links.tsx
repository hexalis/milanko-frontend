import Link from "next/link";
import { isSectionActive, WORKSPACE_SECTIONS, type SectionLabels } from "../domain/sections";

type WorkspaceNavLinksProps = {
  labels: SectionLabels;
  /** Accessible name of the menu. */
  menuLabel: string;
  /** Current pathname; omit it to render the links without an active section. */
  pathname?: string;
};

export function WorkspaceNavLinks({ labels, menuLabel, pathname }: WorkspaceNavLinksProps) {
  return (
    <nav aria-label={menuLabel}>
      <ul className="flex flex-wrap gap-1.5">
        {WORKSPACE_SECTIONS.map((section) => {
          const isActive = pathname !== undefined && isSectionActive(pathname, section.href);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className="rounded-control text-label-m text-text-secondary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=page]:bg-bg-inverse aria-[current=page]:text-text-inverse inline-flex min-h-10 items-center px-3.5"
              >
                {labels[section.href]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
