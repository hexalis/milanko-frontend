import { TABBAR } from "../domain/sections";
import { NavIcon } from "./rail-parts";
import { ShellNavLink } from "./shell-nav-link";

type WorkspaceTabbarProps = {
  /** Accessible name ("Quick menu"). */
  label: string;
  /** Labels by copy key. */
  labels: Readonly<Record<string, string>>;
};

const TAB =
  "group/item flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-center text-label-xs leading-tight text-text-secondary no-underline transition-colors duration-fast motion-reduce:transition-none hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=page]:bg-action-selected-strong aria-[current=page]:text-selected-fg";

/** Phone tabbar (POC .tabbar): five destinations, fixed above the bottom edge. */
export function WorkspaceTabbar({ label, labels }: WorkspaceTabbarProps) {
  return (
    <nav
      aria-label={label}
      className="border-border-subtle bg-bg-surface shadow-dropdown shell:hidden fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 rounded-[1.75rem] border p-1.5"
    >
      <ul className="grid grid-cols-5 gap-1">
        {TABBAR.map((section) => (
          <li key={section.href} className="min-w-0">
            <ShellNavLink href={section.href} className={TAB}>
              <NavIcon icon={section.icon} hasActiveIcon={section.hasActiveIcon} tone="tab" />
              <span className="max-w-full [overflow-wrap:anywhere]">
                {labels[section.labelKey]}
              </span>
            </ShellNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
