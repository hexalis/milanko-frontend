import Link from "next/link";
import { isSectionActive, WORKSPACE_SECTIONS } from "../domain/sections";

type WorkspaceNavLinksProps = {
  /** Current pathname; omit it to render the links without an active section. */
  pathname?: string;
};

export function WorkspaceNavLinks({ pathname }: WorkspaceNavLinksProps) {
  return (
    <nav aria-label="Secciones">
      <ul className="flex flex-wrap gap-1.5">
        {WORKSPACE_SECTIONS.map((section) => {
          const isActive = pathname !== undefined && isSectionActive(pathname, section.href);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className="text-ink-soft hover:bg-surface-sky aria-[current=page]:bg-night inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-extrabold aria-[current=page]:text-white"
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
