import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { GlowLink, Stars } from "./home-night";
import { HomeOrbit } from "./home-orbit";

/*
 * The home's cover (POC ask.js renderHome .hm-hero): a welcome on the night sky, the two ways in,
 * and the real Earth on its ring. On narrow screens the planet goes first, smaller.
 */

export function HomeHero({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <header className="bg-space medium:mx-0 medium:rounded-[20px] relative isolate -mx-4 grid grid-cols-1 items-center overflow-hidden px-5 pt-4 pb-10 text-white @2xl/home:px-8 @2xl/home:pt-8 @2xl/home:pb-12 @3xl/home:grid-cols-2 @3xl/home:gap-8 @3xl/home:py-14 @3xl/home:ps-14 @3xl/home:pe-12">
      <Stars />
      {/* The tour points at the words, not the whole cover: on phones the cover fills the screen. */}
      <div data-tour="home-hero">
        <h1 className="m-0 max-w-[13ch] text-[36px] leading-[1.02] font-bold tracking-[-0.03em] text-balance text-white @2xl/home:text-[clamp(38px,4.6vw,62px)]">
          {t("home2.title")}
        </h1>
        <p className="font-reading m-0 mt-4 max-w-[34ch] text-[18px] leading-[1.55] text-pretty text-[#eceff3] @2xl/home:mt-5.5 @2xl/home:text-[20px]">
          {t("home2.lead")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 @2xl/home:mt-9">
          <Link
            href="/ask"
            className={`${buttonLink()} max-medium:w-full min-h-[52px] justify-center gap-2.5 px-5`}
          >
            <Icon name="ask" />
            {t("nav.ask")}
          </Link>
          <GlowLink href="/explore" icon="explore">
            {t("home2.map")}
          </GlowLink>
        </div>
        <p className="text-body-s m-0 mt-5.5 max-w-[44ch] border-s-2 border-[#232d48] ps-3.5 text-pretty text-[#c3cad5]">
          {t("home2.note")}
        </p>
      </div>
      <figure className="-order-1 m-0 -mt-6 mb-1 grid w-[min(70%,250px)] gap-1 justify-self-center @2xl/home:mt-0 @2xl/home:w-[min(100%,360px)] @3xl/home:order-none @3xl/home:mb-0 @3xl/home:w-[min(100%,500px)] @3xl/home:justify-self-end">
        <HomeOrbit t={t} />
        <figcaption className="-mt-5 text-center text-[12px] text-[#98a1b0] @2xl/home:mt-0">
          {t("home2.credit")}
        </figcaption>
      </figure>
    </header>
  );
}
