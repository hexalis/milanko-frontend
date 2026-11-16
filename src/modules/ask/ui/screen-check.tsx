import { TrendReadout } from "@/modules/cases";
import { askPath } from "../domain/ask-state";
import { ScienceList, StepLead, type StepProps } from "./guided-parts";
import { GuidedChart, GuidedQuiz } from "./guided-quiz";
import { RevealScroll } from "./reveal-scroll";
import { testRows } from "./test-rows";

/*
 * Screen "check" · is the change real, or could the usual up and down from year to year make it?
 * The reader says first; the test's readout follows (POC ask.js renderAsk, sk === "check").
 */

export function ScreenCheck(props: StepProps) {
  const { view, translator } = props;
  const { t } = translator;
  const { question, file, direction, depth, hunch, reading } = view;
  return (
    <>
      <StepLead>{t("ask.chk.lead")}</StepLead>
      <GuidedChart {...props} withTrend />
      <GuidedQuiz
        action={askPath(question.id)}
        name="r"
        legend={t("ask.chk.q")}
        picked={reading}
        keep={{ s: "check", depth, h: hunch }}
        options={[
          { value: "real", icon: direction, label: t("ask.chk.real") },
          { value: "chance", icon: "shuffle", label: t("ask.chk.chance") },
        ]}
      />
      {reading ? (
        // The test's readout comes into view as soon as the reader has answered.
        <RevealScroll>
          <section
            aria-label={t("ask.flow.check")}
            className="flex flex-col gap-3 motion-safe:transition-[opacity,translate] motion-safe:duration-500 motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0"
          >
            <TrendReadout file={file} translator={translator} />
            {depth === "science" ? <ScienceList rows={testRows(file, translator)} /> : null}
          </section>
        </RevealScroll>
      ) : null}
    </>
  );
}
