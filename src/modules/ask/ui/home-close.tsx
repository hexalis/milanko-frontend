import type { Translator } from "@/shared/lib/i18n";
import { HomeHorizonCanvas } from "./home-horizon-canvas";
import { GlowLink } from "./home-night";
import { HomeSky } from "./home-sky";

/*
 * The home's closing band (POC ask.js renderHome .hm-close): the motto under the night sky,
 * resting on the curve of the Earth seen from orbit, its atmosphere glowing along the rim. Two
 * drawn lines, not data, with their key: one that rises clearly, and one that cannot decide
 * (dashed, "not proven" in the design notes).
 */

const RISE = "#9fe0bf";
const UNSURE = "#c3cad5";

// The atmosphere above the horizon's rim (the planet's centre sits at 58% of the width).
const AIR = {
  backgroundImage:
    "radial-gradient(70% 100% at 58% 100%, rgba(122, 159, 235, 0.38), rgba(64, 100, 198, 0.12) 45%, transparent 75%)",
};

export function HomeClose({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="home-close-title"
      className="bg-space medium:mx-0 medium:rounded-[28px] relative isolate -mx-4 overflow-hidden px-5 pt-12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] @2xl/home:px-10 @2xl/home:pt-16 @3xl/home:px-14 @3xl/home:pt-18"
    >
      <HomeSky scene="dusk" meteorDelay="8s" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[340px]"
        style={AIR}
      />
      <div className="relative z-[1] grid grid-cols-1 items-end gap-8 @2xl/home:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h2
            id="home-close-title"
            className="m-0 max-w-[14ch] bg-linear-to-b from-white from-40% to-[#b9c8f5] bg-clip-text text-[clamp(34px,4.4vw,58px)] leading-[1.03] font-bold tracking-[-0.035em] text-balance text-transparent forced-colors:text-[CanvasText]"
          >
            {t("home.slogan")}
          </h2>
          <p className="font-reading m-0 mt-5 max-w-[44ch] text-[19px] leading-[1.55] text-pretty text-[#c3cad5]">
            {t("home2.close.d")}
          </p>
        </div>
        <GlowLink href="/method" icon="method">
          {t("home.tour.method.go")}
        </GlowLink>
      </div>
      <ul className="relative z-[1] m-0 mt-9 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[13px] font-semibold text-[#dfe4ee]">
        <li className="inline-flex items-center gap-2.5">
          <svg viewBox="0 0 28 4" aria-hidden="true" focusable="false" className="h-1 w-7">
            <line x1="2" x2="26" y1="2" y2="2" stroke={RISE} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {t("home.v.strong")}
        </li>
        <li className="inline-flex items-center gap-2.5">
          <svg viewBox="0 0 28 4" aria-hidden="true" focusable="false" className="h-1 w-7">
            <line
              x1="2"
              x2="26"
              y1="2"
              y2="2"
              stroke={UNSURE}
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          </svg>
          {t("home.v.weak")}
        </li>
      </ul>
      <svg
        viewBox="0 0 1000 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="relative z-[1] mt-3 block h-auto w-full overflow-visible"
      >
        <path
          d="M0 50 C70 38 120 62 190 46 S300 60 360 44 S470 58 540 46 S660 56 720 44 S850 56 1000 46"
          className="fill-none stroke-2 [stroke-dasharray:6_7] [stroke-linecap:round] [stroke-linejoin:round]"
          stroke={UNSURE}
        />
        <path
          d="M0 74 C120 70 180 78 260 66 S400 58 470 52 S620 40 700 30 S860 18 1000 10"
          pathLength={1}
          className="draw-on-view fill-none stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round] drop-shadow-[0_0_6px_rgba(159,224,191,0.55)]"
          stroke={RISE}
        />
      </svg>
      <div className="-mx-5 -mt-9 @2xl/home:-mx-10 @3xl/home:-mx-14">
        <HomeHorizonCanvas />
      </div>
    </section>
  );
}
