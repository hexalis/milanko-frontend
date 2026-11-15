import {
  fileName,
  formatCoordinates,
  GlossaryTerm,
  Mono,
  PropsList,
  trendText,
} from "@/modules/cases";
import { GuidedCallout, StepLead, type StepProps } from "./guided-parts";

/* Step 2 · Where do we look? (POC ask.js L159–174) */

export function StepPlace({ view, translator, catalog }: StepProps) {
  const { t } = translator;
  const { question, file, depth } = view;
  const context = { translator, catalog };
  const place = fileName(file, context);
  const isScience = depth === "science";
  return (
    <>
      <StepLead>
        {question.published ? t(`ask.place.why.${question.id}`) : t("ask.place.why", { place })}
      </StepLead>
      <PropsList
        rows={[
          {
            icon: "map-pin",
            label: t("prop.place"),
            value: (
              <span>
                {place} · {trendText(file, "region", context)}
                {isScience ? (
                  <>
                    {" · "}
                    <Mono>{formatCoordinates(file.lat, file.lon)}</Mono>
                  </>
                ) : null}
              </span>
            ),
          },
          { icon: "check", label: t("ask.place.kind"), value: t("ask.place.curated") },
          ...(isScience
            ? [
                {
                  icon: "satellite",
                  label: t("prop.source"),
                  value: (
                    <span>
                      NASA POWER ·{" "}
                      <GlossaryTerm term="merra" label="MERRA-2" translator={translator} /> · 0.5° ×
                      0.625°
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      <GuidedCallout icon="info-on" title={t("ask.place.cell.t")}>
        {t("ask.place.cell")}
      </GuidedCallout>
      {/*
       * Deferred (POC L170–173): the place seen from orbit (NASA GIBS true colour, compact orbit
       * block with its caption case.orbit.d). GIBS is not ported yet.
       */}
    </>
  );
}
