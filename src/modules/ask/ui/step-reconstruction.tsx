import {
  ChartCaption,
  EvidenceTabs,
  formatFigure,
  rateLabel,
  SeriesChart,
  SourcesList,
  trendText,
  unitLabel,
} from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { GUIDED_SOURCE, unitText } from "../domain/guided";
import { RateFigure, ScienceList, StepLead, type StepProps } from "./guided-parts";
import { slopeRows } from "./step-science";

/* Step 5 · Reconstruction: the trend and its band over the same points (POC ask.js L228–260). */

const POWER_URL = "https://power.larc.nasa.gov/";

export function StepReconstruction({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { file, direction, depth, hunch } = view;
  const context = { translator, catalog };
  const variable = t(`var.${file.variable}`);
  const unit = unitText(file.unit, locale);
  const hasUnit = Boolean(unitLabel(file.unit, locale));
  const digits = file.digits + 1;
  return (
    <>
      <StepLead>{t("ask.recon.lead")}</StepLead>
      <RateFigure
        direction={direction}
        rate={rateLabel(file, context)}
        perDecade={t("perDecade")}
      />
      <EvidenceTabs
        labels={{
          aria: t("tabs.aria"),
          chart: t("tabs.chart"),
          table: t("tabs.table"),
          sources: t("tabs.sources"),
        }}
        chart={
          <>
            <SeriesChart
              data={file.series}
              trend={file.t}
              digits={file.digits}
              unit={unit}
              direction={direction}
              label={trendText(file, "summary", context)}
              recordLabel={t(direction === "down" ? "chart.min" : "chart.max")}
              inline={{
                series: t("case.chart.inline.series"),
                trend: t("case.chart.inline.trend"),
                band: t("case.chart.inline.band"),
              }}
            />
            <ChartCaption>{t("case.evidence.caption", { source: GUIDED_SOURCE })}</ChartCaption>
          </>
        }
        table={
          <Table
            caption={variable}
            head={
              <>
                <Th>{t("tbl.year")}</Th>
                <Th>
                  {variable}
                  {hasUnit ? ` (${unit})` : ""}
                </Th>
                <Th>{t("case.chart.inline.trend")}</Th>
              </>
            }
          >
            {file.series.map(([year, value]) => (
              <Tr key={year}>
                <Td>
                  <span className="font-mono">{year}</span>
                </Td>
                <Td>
                  <span className="tabular-nums">{formatFigure(value, digits)}</span>
                </Td>
                <Td>
                  <span className="tabular-nums">
                    {formatFigure(file.t.intercept + file.t.slope * year, digits)}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        }
        sources={
          <SourcesList
            newTabHint={t("link.newTab")}
            items={[
              {
                icon: "chart",
                name: `NASA POWER · ${file.variable}`,
                url: POWER_URL,
                description: t("src.d.power"),
              },
              {
                icon: "csv",
                name: "portal/scripts/build_cases.py",
                description: t("src.d.script"),
              },
            ]}
          />
        }
      />
      {depth === "science" ? <ScienceList rows={slopeRows(file, translator)} /> : null}
      {hunch ? (
        <p className="bg-surface-tone-5 text-body-m text-text-primary inline-flex items-center gap-2 self-start rounded-[14px] px-3.5 py-2">
          <Icon name="sparkle" />
          <span>
            {t("ask.hyp.yours")}: <strong>{t(`ask.hyp.${hunch}`)}</strong>
          </span>
        </p>
      ) : null}
    </>
  );
}
