import Link from "next/link";
import { formatCoordinates, formatDate, SourcesList } from "@/modules/cases";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { GRID_CELL } from "../domain/guided";
import { ScienceList, StepLead, type StepProps } from "./guided-parts";
import { testRow } from "./step-science";

/* Step 8 · Check it yourself (POC ask.js L325–345). */

const POWER_URL = "https://power.larc.nasa.gov/";
const ACTION = `${buttonLink({ intent: "secondary" })} gap-2`;

export function StepDeeper({ view, translator, catalog }: StepProps) {
  const { t, locale } = translator;
  const { file, depth } = view;
  return (
    <>
      <StepLead>{t("ask.deep.lead")}</StepLead>
      <SourcesList
        newTabHint={t("link.newTab")}
        items={[
          {
            icon: "chart",
            name: `NASA POWER · ${file.variable}`,
            url: POWER_URL,
            description: t("src.d.power"),
          },
          { icon: "csv", name: "portal/scripts/build_cases.py", description: t("src.d.script") },
        ]}
      />
      <p className="text-body-m text-text-secondary flex items-center gap-2">
        <Icon name="check" />
        {t("ask.deep.demo", {
          date: catalog.generated ? formatDate(catalog.generated, locale) : "—",
        })}
      </p>
      <div className="flex flex-wrap gap-3">
        <a href={`/cases/${file.id}/data`} download className={ACTION}>
          <Icon name="csv" />
          {t("case.download")}
        </a>
        <Link href={`/cases/${file.id}`} className={ACTION}>
          <Icon name="cases" />
          {t("ask.deep.case")}
        </Link>
        {/* The POC opened the 3D globe here (#/explore?case=…); the globe is not ported, so the
            reader goes to the data by region. */}
        <Link href="/regions" className={ACTION}>
          <Icon name="explore" />
          {t("nav.regions")}
        </Link>
        <Link href="/method" className={ACTION}>
          <Icon name="method" />
          {t("ask.deep.method")}
        </Link>
      </div>
      {depth === "science" ? (
        <ScienceList
          rows={[
            { key: "code", term: t("ask.sci.code"), value: `${file.variable} · ${file.catalog}` },
            {
              key: "cell",
              term: t("ask.sci.cell"),
              value: `${GRID_CELL} · ${formatCoordinates(file.lat, file.lon)}`,
            },
            testRow(file, translator),
            { key: "built", term: t("ask.sci.built"), value: catalog.generated || "—" },
          ]}
        />
      ) : null}
    </>
  );
}
