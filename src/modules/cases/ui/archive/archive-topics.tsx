import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import {
  ARCHIVE_TOPICS,
  archiveHref,
  withTopic,
  type ArchiveState,
  type ArchiveTopic,
} from "../../domain/archive";

/*
 * Five topics in place of the kind tabs and the filter column (POC renderArchive topics). Links, so
 * each topic is an address; the search, the place and the chips stay. The count beside each says
 * how many files it would show.
 */

const TOPIC_ICONS: Record<ArchiveTopic, string> = {
  all: "cases",
  heat: "temperature",
  water: "water",
  plants: "vegetation",
  disasters: "ev-storm",
};

/*
 * On phones each topic is a chip in one row that slides sideways (icon, name, count), so the files
 * start near the top; from medium up, a card with its question.
 */
const TOPIC = [
  "flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-transparent bg-bg-surface px-3.5 py-2 text-text-primary no-underline shadow-card",
  "medium:grid medium:grid-cols-[auto_minmax(0,1fr)] medium:items-start medium:gap-x-2.5 medium:gap-y-1 medium:whitespace-normal medium:rounded-card medium:p-3.5",
  "transition-transform duration-fast hover:-translate-y-px active:translate-y-0",
  "focus-visible:focus-ring focus-visible:outline-focus-ring aria-[current=true]:border-action-primary",
].join(" ");

type ArchiveTopicsProps = {
  state: ArchiveState;
  counts: Record<ArchiveTopic, number>;
  translator: Translator;
};

export function ArchiveTopics({ state, counts, translator }: ArchiveTopicsProps) {
  const { t } = translator;
  return (
    <nav aria-label={t("arch.topics")} data-tour="arch-topics">
      <ul className="medium:grid medium:grid-cols-3 expanded:grid-cols-5 medium:gap-3 medium:overflow-visible medium:mx-0 medium:px-0 medium:py-0 -mx-4 flex snap-x scroll-px-4 [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain px-4 py-1">
        {ARCHIVE_TOPICS.map((topic) => (
          <li key={topic} className="flex shrink-0 snap-start">
            <Link
              href={archiveHref(withTopic(state, topic))}
              aria-current={state.topic === topic ? "true" : undefined}
              className={`${TOPIC} w-full`}
            >
              <span className="text-text-brand">
                <Icon name={TOPIC_ICONS[topic]} size="lg" />
              </span>
              <span className="text-body-s text-text-secondary medium:order-none order-last justify-self-end tabular-nums">
                {counts[topic]}
              </span>
              <strong className="text-body-l font-display medium:col-span-2 leading-tight font-semibold">
                {t(`topic.${topic}`)}
              </strong>
              <span className="text-body-s text-text-secondary medium:block col-span-2 hidden leading-snug">
                {t(`topic.${topic}.q`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
