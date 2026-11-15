import type { Translator } from "@/shared/lib/i18n";
import { HomeHorizonCanvas } from "./home-horizon-canvas";
import { GlowLink, Stars } from "./home-night";

/*
 * The home's closing band (POC ask.js renderHome .hm-close): the motto, resting on the curve of
 * the Earth seen from orbit. Two drawn lines, not data: one that rises clearly, one that cannot
 * decide (dashed, "not proven" in the design notes).
 */

export function HomeClose({ translator }: { translator: Translator }) {
  const { t } = translator;
  return (
    <section
      aria-labelledby="home-close-title"
      className="bg-space medium:mx-0 medium:rounded-[20px] relative isolate -mx-4 overflow-hidden px-5 pt-10 text-white @2xl/home:px-8 @2xl/home:pt-12 @3xl/home:px-14 @3xl/home:pt-14"
    >
      <Stars />
      <div className="relative z-[1] grid grid-cols-1 items-end gap-8 @2xl/home:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h2
            id="home-close-title"
            className="m-0 max-w-[14ch] text-[clamp(32px,4vw,52px)] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-white"
          >
            {t("home.slogan")}
          </h2>
          <p className="font-reading m-0 mt-4 max-w-[44ch] text-[19px] leading-[1.55] text-pretty text-[#c3cad5]">
            {t("home2.close.d")}
          </p>
        </div>
        <GlowLink href="/method" icon="method">
          {t("home.tour.method.go")}
        </GlowLink>
      </div>
      <svg
        viewBox="0 0 1000 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="relative z-[1] mt-8 block h-auto w-full"
      >
        <path
          d="M0 74 C120 70 180 78 260 66 S400 58 470 52 S620 40 700 30 S860 18 1000 10"
          className="fill-none stroke-[#9fe0bf] stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]"
        />
        <path
          d="M0 50 C70 38 120 62 190 46 S300 60 360 44 S470 58 540 46 S660 56 720 44 S850 56 1000 46"
          className="fill-none stroke-[#c3cad5] stroke-2 [stroke-dasharray:6_7] [stroke-linecap:round] [stroke-linejoin:round]"
        />
      </svg>
      <div className="-mx-5 -mt-9 @2xl/home:-mx-8 @3xl/home:-mx-14">
        <HomeHorizonCanvas />
      </div>
    </section>
  );
}
