import { Icon } from "@/shared/ui/icon";

/*
 * Building blocks shared by the rail's links and buttons. Each item is a `group/item`, so its
 * icon, active bar and tooltip follow the item's hover, focus and aria-current.
 */

export const RAIL_ITEM =
  "group/item relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-label-m text-text-secondary no-underline transition-colors duration-fast motion-reduce:transition-none hover:bg-bg-hover hover:text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=page]:bg-action-selected aria-[current=page]:font-semibold aria-[current=page]:text-text-primary before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-action-primary before:opacity-0 aria-[current=page]:before:opacity-100 nav-collapsed:justify-center nav-collapsed:px-0";

/** Visible label of an item; screen-reader only on the collapsed rail, where its tooltip shows it. */
export const RAIL_LABEL = "min-w-0 flex-1 truncate nav-collapsed:sr-only";

const TIP_BASE =
  "pointer-events-none absolute start-full top-1/2 z-40 ms-3 hidden -translate-y-1/2 rounded-tooltip bg-bg-inverse px-2.5 py-1.5 text-label-s whitespace-nowrap text-text-inverse shadow-dropdown";

const TIP = {
  /** Only the collapsed rail needs it: open, the label is on screen. */
  collapsed: `${TIP_BASE} nav-collapsed:group-hover/item:block nav-collapsed:group-focus-visible/item:block`,
  /** Icon-only controls (collapse, theme) show it in both states. */
  always: `${TIP_BASE} group-hover/item:block group-focus-visible/item:block`,
} as const;

type RailTipProps = { label: string; when?: keyof typeof TIP };

/** Visual tooltip; the control's own label (sr-only text or aria-label) carries the name. */
export function RailTip({ label, when = "collapsed" }: RailTipProps) {
  return (
    <span aria-hidden="true" className={TIP[when]}>
      {label}
    </span>
  );
}

const ICON_TONE = {
  /** Rail: the active icon takes the brand colour beside its bar. */
  rail: "text-icon-secondary group-hover/item:text-icon-primary group-aria-[current=page]/item:text-icon-brand flex text-lg",
  /** Tabbar: the active tab is filled, so its icon follows the selected text colour. */
  tab: "text-icon-secondary group-hover/item:text-icon-primary group-aria-[current=page]/item:text-selected-fg flex text-xl",
} as const;

type NavIconProps = { icon: string; hasActiveIcon: boolean; tone?: keyof typeof ICON_TONE };

/** Outline icon at rest, the filled `-on` twin when its item is the current page. */
export function NavIcon({ icon, hasActiveIcon, tone = "rail" }: NavIconProps) {
  if (!hasActiveIcon) {
    return (
      <span className={ICON_TONE[tone]}>
        <Icon name={icon} />
      </span>
    );
  }
  return (
    <span className={ICON_TONE[tone]}>
      <span className="flex group-aria-[current=page]/item:hidden">
        <Icon name={icon} />
      </span>
      <span className="hidden group-aria-[current=page]/item:flex">
        <Icon name={`${icon}-on`} />
      </span>
    </span>
  );
}
