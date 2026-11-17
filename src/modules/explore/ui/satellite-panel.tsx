import Image from "next/image";
import type { Ref } from "react";
import { withBasePath } from "@/shared/lib/base-path";
import { Icon } from "@/shared/ui/icon";
import { ExternalLink } from "@/shared/ui/text-link";
import type { ExploreT } from "../domain/explore-copy";
import { Actions, Facts, PanelHead, PRIMARY_LINK } from "./drawer-parts";

const TERRA_AT_NASA = "https://terra.nasa.gov/";
// NASA's rendering of Terra (public domain) over Earth's horizon as photographed from the ISS (NASA, iss067e316063).
const TERRA_BANNER = "/satellites/terra.webp";

type SatellitePanelProps = {
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
  /** Shows the satellite's greenness (NDVI) on the globe's data layer. */
  onShowGreenness: () => void;
};

/**
 * NASA's Terra satellite, tapped in the globe's sky: NASA's picture of it, what it does, and what the portal takes
 * from it. While this panel is open the globe's camera rides along with the satellite; closing it comes back.
 * The globe drew its card itself outside the portal; inside, the card lives here.
 */
export function SatellitePanel({ t, titleRef, onShowGreenness }: SatellitePanelProps) {
  const uses = ["exp.sat.use.ndvi", "exp.sat.use.data", "exp.sat.use.img"];
  return (
    <div className="flex flex-col gap-4">
      <PanelHead icon="satellite" kind={t("exp.sat.kind")} title="Terra" titleRef={titleRef} />
      <figure className="rounded-field bg-bg-surface-sunken relative overflow-hidden">
        <Image
          src={withBasePath(TERRA_BANNER)}
          alt={t("exp.sat.img")}
          width={1200}
          height={400}
          sizes="(min-width: 768px) 28rem, 100vw"
          className="aspect-[3/1] max-h-40 w-full object-cover object-[70%_50%]"
        />
        <figcaption className="text-label-s absolute end-2 bottom-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-white">
          {t("exp.sat.credit")}
        </figcaption>
      </figure>
      <p className="text-body-m text-text-primary">{t("exp.sat.lead")}</p>
      <p className="text-body-s text-text-secondary flex gap-2">
        <span className="pt-0.5">
          <Icon name="orbit" />
        </span>
        {t("exp.sat.ride")}
      </p>
      <Facts
        facts={[
          { label: t("exp.sat.since"), value: "1999" },
          { label: t("exp.sat.height"), value: "705 km" },
          { label: t("exp.sat.lap"), value: "99 min" },
          { label: t("exp.sat.sees"), value: t("exp.sat.sees.v") },
        ]}
      />
      <section className="flex flex-col gap-2" aria-labelledby="sat-uses">
        <h3 id="sat-uses" className="text-label-l text-text-primary">
          {t("exp.sat.uses")}
        </h3>
        <ul className="text-body-s text-text-secondary flex list-disc flex-col gap-1.5 ps-5">
          {uses.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>
      <p className="text-body-s text-text-tertiary">{t("exp.sat.note")}</p>
      <p className="text-body-s">
        <ExternalLink href={TERRA_AT_NASA} newTabHint={t("link.newTab")}>
          {t("exp.sat.link")}
        </ExternalLink>
      </p>
      <Actions>
        <button type="button" className={PRIMARY_LINK} onClick={onShowGreenness}>
          <Icon name="vegetation" />
          {t("exp.sat.see")}
        </button>
      </Actions>
    </div>
  );
}
