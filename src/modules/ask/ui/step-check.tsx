import { formatOdds, TrendReadout } from "@/modules/cases";
import { ScienceList, StepLead, type StepProps } from "./guided-parts";
import { slopeRows, snrAndCountRows, testRow } from "./step-science";

/* Step 6 · Is it a real trend, or could it be chance? (POC ask.js L263–276) */

export function StepCheck({ view, translator }: StepProps) {
  const { t } = translator;
  const { file, depth } = view;
  return (
    <>
      <StepLead>{t("ask.check.lead")}</StepLead>
      <TrendReadout file={file} translator={translator} />
      <p className="text-body-m text-text-secondary max-w-[72ch]">
        {t("case.chance", { odds: formatOdds(file.t.p, translator) })}
      </p>
      {depth === "science" ? (
        <ScienceList
          rows={[
            testRow(file, translator),
            ...slopeRows(file, translator),
            ...snrAndCountRows(file, translator),
          ]}
        />
      ) : null}
    </>
  );
}
