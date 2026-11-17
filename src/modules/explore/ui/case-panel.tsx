import type { Ref } from "react";
import { EvidenceMeter, Sparkline, VerdictStamp, type CaseSummary } from "@/modules/cases";
import { Icon } from "@/shared/ui/icon";
import type { ExploreT } from "../domain/explore-copy";
import { Actions, CaseFileLink, DIRECTION_TEXT, PanelHead, SECONDARY_BUTTON } from "./drawer-parts";

type CasePanelProps = {
  file: CaseSummary;
  t: ExploreT;
  titleRef: Ref<HTMLHeadingElement>;
  onSector: (id: string) => void;
};

/**
 * A case file in the drawer (the POC's casePanel): verdict, headline figure, sparkline and summary,
 * then the dossier. Deferred: the POC's "show this category on the globe" button for anomaly files.
 */
export function CasePanel({ file, t, titleRef, onSector }: CasePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <PanelHead
        icon={file.themeIcon}
        kind={
          <>
            {file.themeLabel} · <span className="font-mono">{file.catalog}</span>
          </>
        }
        title={file.title}
        titleRef={titleRef}
      />
      <p className="text-body-s text-text-secondary flex items-center gap-1.5">
        <Icon name="map-pin" />
        {file.place}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <VerdictStamp verdict={file.verdict} label={file.verdictLabel} />
        <EvidenceMeter strength={file.strength} word={file.strengthWord} />
      </div>
      <p
        className={`text-heading-h4 font-display flex flex-wrap items-baseline gap-x-2 tabular-nums ${DIRECTION_TEXT[file.direction]}`}
      >
        <Icon name={file.direction} />
        {file.figure}
        <span className="text-body-s text-text-secondary font-sans">{file.figureNote}</span>
      </p>
      <Sparkline
        id={`drawer-${file.id}`}
        series={file.series}
        trend={file.trend}
        direction={file.direction}
        isLastMarked={file.kind === "event"}
      />
      <p className="text-body-m text-text-primary">{file.summary}</p>
      <Actions>
        <CaseFileLink href={`/cases/${file.id}`}>{t("drawer.view")}</CaseFileLink>
        <button type="button" className={SECONDARY_BUTTON} onClick={() => onSector(file.region)}>
          <Icon name="map-pin" />
          {t(`reg.${file.region}`)}
        </button>
      </Actions>
    </div>
  );
}
