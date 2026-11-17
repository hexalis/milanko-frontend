import Link from "next/link";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { GlowLink } from "./home-night";
import { HomeOrbit } from "./home-orbit";
import { HomeSky } from "./home-sky";

/*
 * The home's cover (POC ask.js renderHome .hm-hero): a welcome under the 3D globe's night sky, the
 * two ways in, and the real Earth on its ring, lit from behind by its own atmosphere. A strip at
 * the foot names where the data come from (names only, no figures). On narrow screens the planet
 * goes first, smaller.
 */

// The NASA sources behind every case file: proper names, the same in every language.
const SOURCES = ["NASA POWER", "MERRA-2", "MODIS / Terra", "NASA EONET", "NASA GIBS"] as const;

// The Earth's glow: the blue of the atmosphere, then the night.
const HALO = {
  backgroundImage:
    "radial-gradient(closest-side, rgba(122, 159, 235, 0.42), rgba(64, 100, 198, 0.16) 55%, transparent 100%)",
};

export function HomeHero({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <header className="bg-space medium:mx-0 medium:rounded-[28px] relative isolate -mx-4 overflow-hidden text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <HomeSky scene="dawn" />
      <div className="grid grid-cols-1 items-center px-5 pt-4 pb-9 @2xl/home:px-10 @2xl/home:pt-10 @2xl/home:pb-12 @3xl/home:min-h-[560px] @3xl/home:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] @3xl/home:gap-6 @3xl/home:ps-14 @3xl/home:pe-10">
        {/* The tour points at the words, not the whole cover: on phones the cover fills the screen. */}
        <div data-tour="home-hero" className="motion-safe:animate-enter">
          {/* On a phone the badge would push the button off the first screen; the credit names NASA. */}
          <p className="m-0 hidden items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 ps-2 pe-3.5 text-[13px] font-semibold tracking-[0.01em] text-[#c8d6ff] backdrop-blur-sm @2xl/home:inline-flex">
            <span className="grid size-6 place-items-center rounded-full bg-[#4064c6]/40 text-white">
              <Icon name="satellite" size="sm" />
            </span>
            {t("home2.eyebrow")}
          </p>
          <h1 className="m-0 mt-1 max-w-[15ch] bg-linear-to-b from-white from-40% to-[#b9c8f5] bg-clip-text text-[32px] leading-[1.05] font-bold tracking-[-0.035em] text-balance text-transparent @2xl/home:mt-6 @2xl/home:text-[clamp(42px,5vw,70px)] forced-colors:text-[CanvasText]">
            {t("home2.title")}
          </h1>
          <p className="font-reading m-0 mt-3 max-w-[34ch] text-[17px] leading-[1.5] text-pretty text-[#dfe4ee] @2xl/home:mt-6 @2xl/home:text-[21px]">
            {t("home2.lead")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 @2xl/home:mt-9">
            <Link
              href="/ask"
              className={`${buttonLink()} max-medium:w-full min-h-[54px] justify-center gap-2.5 px-6 shadow-[0_10px_32px_-8px_rgba(64,100,198,0.9)]`}
            >
              <Icon name="ask" />
              {t("nav.ask")}
            </Link>
            <GlowLink href="/explore" icon="explore">
              {t("home2.map")}
            </GlowLink>
          </div>
          <p className="text-body-s m-0 mt-6 max-w-[44ch] border-s-2 border-[#4064c6]/70 ps-3.5 text-pretty text-[#c3cad5]">
            {t("home2.note")}
          </p>
        </div>
        <figure className="relative -order-1 m-0 -mt-4 mb-2 grid w-[min(62%,230px)] gap-1 justify-self-center @2xl/home:mt-0 @2xl/home:w-[min(100%,380px)] @3xl/home:order-none @3xl/home:mb-0 @3xl/home:w-[min(100%,520px)] @3xl/home:justify-self-end">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-14%] -z-10 rounded-full motion-safe:animate-[enter_1200ms_ease-out_both]"
            style={HALO}
          />
          <HomeOrbit t={t} />
          <figcaption className="-mt-4 text-center text-[11px] text-[#98a1b0] @2xl/home:mt-0 @2xl/home:text-[12px]">
            {t("home2.credit")}
          </figcaption>
        </figure>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-white/10 bg-[#06080f]/45 px-5 py-4 backdrop-blur-[2px] @2xl/home:px-10 @3xl/home:ps-14">
        <p className="m-0 text-[12px] font-semibold tracking-[0.08em] text-[#98a1b0] uppercase">
          {t("home2.sources")}
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {SOURCES.map((source) => (
            <li
              key={source}
              className="rounded-full border border-white/12 px-3 py-1 text-[13px] font-medium text-[#dfe4ee]"
            >
              {source}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
