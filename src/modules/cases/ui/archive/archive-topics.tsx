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

const TOPIC = [
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1 rounded-card border-2 border-transparent bg-bg-surface p-3.5 text-text-primary no-underline shadow-card",
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
      <ul className="medium:grid-cols-3 expanded:grid-cols-5 grid grid-cols-2 gap-3">
        {ARCHIVE_TOPICS.map((topic) => (
          <li key={topic} className="flex">
            <Link
              href={archiveHref(withTopic(state, topic))}
              aria-current={state.topic === topic ? "true" : undefined}
              className={`${TOPIC} w-full`}
            >
              <span className="text-text-brand">
                <Icon name={TOPIC_ICONS[topic]} size="lg" />
              </span>
              <span className="text-body-s text-text-secondary justify-self-end tabular-nums">
                {counts[topic]}
              </span>
              <strong className="text-body-l font-display col-span-2 leading-tight font-semibold">
                {t(`topic.${topic}`)}
              </strong>
              <span className="text-body-s text-text-secondary col-span-2 leading-snug">
                {t(`topic.${topic}.q`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
