import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";

/*
 * "I want to explore" (POC ask.js askExplore L88–104): the ways to wander without a question, as
 * large as the question door. The POC's first card opened the 3D globe, which is not ported; it
 * opens the region explorer instead.
 */

type ExploreDoorProps = {
  translator: Translator;
  /** Case files in the archive, quoted by the copy. */
  fileCount: number;
};

type ExploreCard = { href: string; icon: string; title: string; description?: string };

const CARD = [
  "flex h-full flex-col gap-1.5 rounded-card bg-bg-surface p-5 text-text-primary no-underline medium:min-h-[170px]",
  "shadow-card transition-[transform,box-shadow] duration-fast ease-standard",
  "hover:-translate-y-px hover:shadow-card",
  "active:translate-y-[3px] active:shadow-card",
  "motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

function exploreCards({ t, has }: Translator, fileCount: number): ExploreCard[] {
  return [
    {
      href: "/regions",
      icon: "explore-on",
      title: t("nav.regions"),
      // No copy describes the region explorer on the home yet; the card shows its title alone.
      description: has("home.explore.regions.d") ? t("home.explore.regions.d") : undefined,
    },
    {
      href: "/cases",
      icon: "cases-on",
      title: t("home.explore.cases"),
      description: t("home.explore.cases.d", { n: fileCount }),
    },
    {
      href: "/briefing",
      icon: "briefing-on",
      title: t("home.explore.briefing"),
      description: t("home.explore.briefing.d"),
    },
  ];
}

export function ExploreDoor({ translator, fileCount }: ExploreDoorProps) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="explore-door-title"
      className="bg-surface-tone-4 rounded-shell medium:p-7 shadow-card flex flex-col gap-3 p-5"
    >
      <h2
        id="explore-door-title"
        className="text-text-primary m-0 text-[clamp(26px,3vw,32px)] leading-tight font-semibold"
      >
        {t("home.explore.t")}
      </h2>
      <p className="text-body-l font-reading text-text-secondary m-0 max-w-[52ch]">
        {t("home.explore.d", { n: fileCount })}
      </p>
      <ul className="medium:grid-cols-3 m-0 mt-2 grid list-none grid-cols-1 gap-4 p-0">
        {exploreCards(translator, fileCount).map((card) => (
          <li key={card.href}>
            <Link href={card.href} className={CARD}>
              <span className="text-text-brand">
                <Icon name={card.icon} size="lg" />
              </span>
              <span className="font-display text-[22px] leading-tight font-semibold">
                {card.title}
              </span>
              {card.description ? (
                <span className="text-body-m text-text-secondary">{card.description}</span>
              ) : null}
              <span className="text-text-brand mt-auto inline-flex items-center gap-1.5 font-semibold">
                {t("home.explore.go")}
                <Icon name="arrow-right" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
