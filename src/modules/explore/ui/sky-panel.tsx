import { useState, type Ref } from "react";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import type { ExploreT } from "../domain/explore-copy";
import { moonPhase, type ConstellationId, type SkyId } from "../domain/sky";
import { Facts, PanelHead } from "./drawer-parts";

const MOON_AT_NASA = "https://science.nasa.gov/moon/";
const APOLLO_11_AT_NASA = "https://www.nasa.gov/mission/apollo-11/";
const FACT_KEYS = ["f1", "f2", "f3"] as const;

type SkyPanelProps = {
  id: SkyId;
  /** The reader found the Apollo 11 mark on the Moon (three taps in the globe). */
  apollo: boolean;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
};

function FactList({ items }: { items: readonly string[] }) {
  return (
    <ul className="text-body-s text-text-secondary flex list-disc flex-col gap-1.5 ps-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** The Moon: today's real phase, a few facts, and Apollo 11 once its mark has been found. */
function MoonPanel({ apollo, t, titleRef }: Omit<SkyPanelProps, "id">) {
  // Read once when the panel opens, so the phase does not change under the reader.
  const [phase] = useState(() => moonPhase(new Date()));
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon="moon"
        kind={t("exp.sky.moon.kind")}
        title={t("exp.sky.moon.title")}
        titleRef={titleRef}
      />
      <p className="text-body-m text-text-primary">{t("exp.sky.moon.lead")}</p>
      <Facts
        facts={[
          {
            label: t("exp.sky.moon.today"),
            value: t("exp.sky.moon.phase", {
              phase: t(`exp.sky.phase.${phase.key}`),
              pct: Math.round(phase.lit * 100),
            }),
          },
          { label: t("exp.sky.moon.distance"), value: t("exp.sky.moon.distance.v") },
          { label: t("exp.sky.moon.size"), value: t("exp.sky.moon.size.v") },
          { label: t("exp.sky.moon.turn"), value: t("exp.sky.moon.turn.v") },
        ]}
      />
      <FactList items={FACT_KEYS.map((key) => t(`exp.sky.moon.${key}`))} />
      {apollo ? (
        <section
          className="rounded-field border-border-subtle bg-bg-surface-sunken flex flex-col gap-2 border p-4"
          aria-labelledby="sky-apollo"
        >
          <h3 id="sky-apollo" className="text-label-l text-text-primary flex items-center gap-1.5">
            <Icon name="sparkle" />
            {t("exp.sky.apollo.title")}
          </h3>
          <p className="text-body-s text-text-primary">{t("exp.sky.apollo.found")}</p>
          <FactList items={FACT_KEYS.map((key) => t(`exp.sky.apollo.${key}`))} />
          <p className="text-body-s">
            <ExternalLink href={APOLLO_11_AT_NASA} newTabHint={t("link.newTab")}>
              {t("exp.sky.apollo.link")}
            </ExternalLink>
          </p>
        </section>
      ) : null}
      <p className="text-body-s text-text-tertiary">{t("exp.sky.moon.note")}</p>
      <p className="text-body-s">
        <ExternalLink href={MOON_AT_NASA} newTabHint={t("link.newTab")}>
          {t("exp.sky.moon.link")}
        </ExternalLink>
      </p>
    </div>
  );
}

/** A constellation: what its figure is, its brightest star, where it shows, three things worth knowing. */
function ConstellationPanel({
  id,
  t,
  titleRef,
}: Omit<SkyPanelProps, "id" | "apollo"> & { id: ConstellationId }) {
  const key = (part: string) => `exp.sky.c.${id}.${part}`;
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon="sparkle"
        kind={t("exp.sky.c.kind")}
        title={t(key("name"))}
        titleRef={titleRef}
      />
      <p className="text-body-m text-text-primary">{t(key("lead"))}</p>
      <p className="text-body-s text-text-secondary flex gap-2">
        <span className="pt-0.5">
          <Icon name="sparkle" />
        </span>
        {t("exp.sky.c.figure")}
      </p>
      <Facts
        facts={[
          { label: t("exp.sky.c.star"), value: t(key("star")) },
          { label: t("exp.sky.c.seen"), value: t(key("seen")) },
        ]}
      />
      <FactList items={FACT_KEYS.map((fact) => t(key(fact)))} />
      <p className="text-body-s text-text-tertiary">{t("exp.sky.c.note")}</p>
    </div>
  );
}

/**
 * Something tapped in the globe's sky other than the satellite. The globe keeps it lit (the Moon's
 * halo, the constellation's figure) while this panel is open; outside the portal it drew this card itself.
 */
export function SkyPanel({ id, apollo, t, titleRef }: SkyPanelProps) {
  return id === "moon" ? (
    <MoonPanel apollo={apollo} t={t} titleRef={titleRef} />
  ) : (
    <ConstellationPanel id={id} t={t} titleRef={titleRef} />
  );
}
