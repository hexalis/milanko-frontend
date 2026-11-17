import Link from "next/link";
import type { Ref } from "react";
import { EvidenceMeter, type CaseSummary } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import type { ExploreT } from "../domain/explore-copy";
import { sectorFiles } from "../domain/sector-files";
import type { SectorId } from "../domain/sectors";
import { Actions, CaseFileLink, DIRECTION_TEXT, Facts, PanelHead } from "./drawer-parts";

type SectorPanelProps = {
  id: SectorId;
  files: readonly CaseSummary[];
  /** Days of the anomaly run-up window, for the section note. */
  windowDays: number;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
  onCase: (id: string) => void;
};

function FileRow({
  file,
  t,
  onCase,
}: {
  file: CaseSummary;
  t: ExploreT;
  onCase: (id: string) => void;
}) {
  return (
    <li className="border-border-subtle flex items-start gap-3 border-b py-3 last:border-b-0">
      <Icon name={file.themeIcon} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/cases/${file.id}`}
          className="text-label-l text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring rounded-xs hover:underline"
        >
          {file.kind === "event" ? file.title : file.name}
        </Link>
        <span className="text-body-s text-text-secondary">{file.rowNote}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={`text-label-m inline-flex items-center gap-1 tabular-nums ${DIRECTION_TEXT[file.direction]}`}
          >
            <Icon name={file.direction} />
            {file.short}
          </span>
          <EvidenceMeter strength={file.strength} word={file.strengthWord} isWordHidden />
        </span>
      </div>
      <button
        type="button"
        onClick={() => onCase(file.id)}
        aria-label={`${t("case.globe")}: ${file.kind === "event" ? file.title : file.name}`}
        className="rounded-control text-text-secondary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring inline-flex size-10 shrink-0 items-center justify-center"
      >
        <Icon name="globe-pin" />
      </button>
    </li>
  );
}

/**
 * A sector's dossier (the POC's sectorPanel): anomaly files first, then trends, each linking to its
 * dossier and able to fly the globe there. Deferred: the per-sector EONET counts (fillSectorEvents),
 * which also switch the globe to the events layer.
 */
export function SectorPanel({ id, files, windowDays, t, titleRef, onCase }: SectorPanelProps) {
  const here = sectorFiles(files, id);
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon="map-pin"
        kind={t("exp.sectors")}
        title={t(`reg.${id}`)}
        titleRef={titleRef}
      />
      <Facts
        facts={[
          { label: t("exp.k.files"), value: here.total },
          {
            label: t("exp.k.anom"),
            value: (
              <span className="text-trend-up">
                {here.anomalous}
                {here.unusual ? (
                  <span className="text-body-s text-text-secondary ms-1.5">
                    {t("exp.k.unusual", { n: here.unusual })}
                  </span>
                ) : null}
              </span>
            ),
          },
        ]}
      />
      {here.total === 0 ? (
        <p className="text-body-s text-text-secondary">{t("exp.sector.none")}</p>
      ) : null}
      {here.anomalies.length ? (
        <section aria-labelledby="sector-anomalies" className="flex flex-col gap-1">
          <h3
            id="sector-anomalies"
            className="text-label-l text-text-primary flex items-center gap-1.5"
          >
            <Icon name="warning" />
            {t("exp.sec.anom")}
          </h3>
          <p className="text-body-s text-text-secondary">
            {t("exp.sec.anom.d", { days: windowDays })}
          </p>
          <ul>
            {here.anomalies.map((file) => (
              <FileRow key={file.id} file={file} t={t} onCase={onCase} />
            ))}
          </ul>
        </section>
      ) : null}
      {here.trends.length ? (
        <section aria-labelledby="sector-trends" className="flex flex-col gap-1">
          <h3
            id="sector-trends"
            className="text-label-l text-text-primary flex items-center gap-1.5"
          >
            <Icon name="chart" />
            {t("arch.kind.trend")}
          </h3>
          <ul>
            {here.trends.map((file) => (
              <FileRow key={file.id} file={file} t={t} onCase={onCase} />
            ))}
          </ul>
        </section>
      ) : null}
      <Actions>
        <CaseFileLink href={`/cases?region=${id}`}>{t("exp.sector.archive")}</CaseFileLink>
      </Actions>
    </div>
  );
}
