import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import {
  ARCHIVE_KINDS,
  archiveHref,
  withKind,
  type ArchiveKind,
  type ArchiveState,
} from "../../domain/archive";

/*
 * Kind of file (POC renderArchive "kinds"): all, trend files, anomaly files. Links, so each tab
 * is an address; switching keeps the other filters. The POC's catalog-audit tab is not ported here.
 */

const KIND_ICONS: Record<ArchiveKind, string> = {
  all: "cases-on",
  trend: "chart",
  event: "warning",
};

const TAB = [
  "relative flex min-h-touch-min shrink-0 items-center gap-2 rounded-t-sm px-4 whitespace-nowrap no-underline medium:min-h-10",
  "text-label-m text-text-secondary hover:text-text-primary hover:bg-bg-hover",
  "aria-[current=page]:text-text-brand aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-action-primary aria-[current=page]:after:content-['']",
  "focus-visible:focus-ring focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
].join(" ");

type KindTabsProps = {
  state: ArchiveState;
  counts: Record<ArchiveKind, number>;
  translator: Translator;
};

export function KindTabs({ state, counts, translator }: KindTabsProps) {
  const { t } = translator;
  return (
    <nav aria-label={t("arch.kinds")}>
      <ul className="border-border-subtle flex max-w-full [scrollbar-width:none] gap-1 overflow-x-auto border-b">
        {ARCHIVE_KINDS.map((kind) => (
          <li key={kind} className="flex">
            <Link
              href={archiveHref(withKind(state, kind))}
              aria-current={state.kind === kind ? "page" : undefined}
              className={TAB}
            >
              <span className="text-icon-secondary">
                <Icon name={KIND_ICONS[kind]} />
              </span>
              {t(`arch.kind.${kind}`)}
              <span className="text-caption text-text-tertiary tabular-nums">{counts[kind]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
