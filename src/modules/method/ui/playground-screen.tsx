import {
  caseFilePath,
  fileName,
  getEventAudit,
  unitLabel,
  type CaseCatalog,
} from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import { TextLink } from "@/shared/ui/text-link";
import { methodFacts } from "../domain/method-facts";
import { NOISE_LAB_KEYS, pickLabCopy, PLAYGROUND_KEYS, RARE_LAB_KEYS } from "./lab-copy";
import { LabTabs } from "./lab-tabs";
import { NoiseLab } from "./noise-lab";
import { Playground, type PlaygroundSeries } from "./playground";
import { RareLab } from "./rare-lab";

/*
 * The data playground's page (the banner of "How we know" leads here): everything the reader can
 * try, one experiment at a time behind cards that say what each does. First the real yearly
 * series of the trend files (named in the reader's language, handed to the client as plain data),
 * then the two short experiments: make your own planet, and peak or record. Each shows itself with
 * a cursor the first time it comes into view, then hands over.
 */

type PlaygroundScreenProps = { catalog: CaseCatalog; translator: Translator };

export function PlaygroundScreen({ catalog, translator }: PlaygroundScreenProps) {
  const { t, locale } = translator;
  const series: PlaygroundSeries[] = catalog.trends.map((file) => ({
    id: file.id,
    code: file.catalog,
    place: fileName(file, { translator, catalog }),
    variable: t(`var.${file.variable}`),
    unit: unitLabel(file.unit, locale),
    rawUnit: file.unit,
    digits: file.digits,
    href: caseFilePath(file.id),
    series: file.series,
  }));
  const lastYear = methodFacts(catalog, getEventAudit().events).lastYear;
  return (
    <PageShell kicker={t("nav.method")} title={t("pg.title")} lead={t("pg.lead")}>
      <nav aria-label={t("nav.breadcrumb")} className="text-label-m -mt-2 mb-2 flex">
        <TextLink href="/method">
          <Icon name="arrow-left" size="sm" />
          {t("nav.method")}
        </TextLink>
      </nav>
      <LabTabs
        label={t("pg.title")}
        tabs={[
          {
            id: "real",
            icon: "chart",
            label: t("pg.tab.real"),
            note: t("pg.tab.real.d"),
            lead: t("pg.tab.real.lead"),
            panel: <Playground copy={pickLabCopy(translator, PLAYGROUND_KEYS)} series={series} />,
          },
          {
            id: "trend",
            icon: "sparkle",
            label: t("method.lab.trend"),
            note: t("pg.tab.trend.d"),
            lead: t("method.play.lead"),
            panel: <NoiseLab copy={pickLabCopy(translator, NOISE_LAB_KEYS)} lastYear={lastYear} />,
          },
          {
            id: "rare",
            icon: "dice",
            label: t("method.lab.rare"),
            note: t("pg.tab.rare.d"),
            lead: t("method.rare.lead"),
            panel: <RareLab copy={pickLabCopy(translator, RARE_LAB_KEYS)} />,
          },
        ]}
      />
    </PageShell>
  );
}
