import Image from "next/image";
import type { Translator } from "@/shared/lib/i18n";
import { buttonLink } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { ScrollRegion } from "@/shared/ui/scroll-region";
import { Table, Td, Th, Tr } from "@/shared/ui/table";
import { ExternalLink } from "@/shared/ui/text-link";
import type { CaseReading } from "../../domain/case-reading";
import { formatDate } from "../../domain/format";
import { EvidenceBlock, THEME_TONE } from "./doc-parts";
import { ReadingChart } from "./reading-chart";
import { ExactList, Plain, ReadingSection, ToneScale } from "./reading-parts";

/* Sections two to six of a case file: data, how sure, what it does not say, why, sources. */

type SectionProps = { reading: CaseReading; translator: Translator };

export function DataSection({ reading, translator }: SectionProps) {
  const { t } = translator;
  const { chart } = reading;
  return (
    <ReadingSection id="cf-data" title={t("cf.s.data")}>
      <Plain>{chart.plain}</Plain>
      <ReadingChart chart={chart.visual} translator={translator} />
      <ExactList rows={chart.exact} />
      <details className="mt-3">
        <summary className="text-label-m text-text-link focus-visible:focus-ring focus-visible:outline-focus-ring min-h-8 cursor-pointer rounded-xs">
          {t("cf.table")}
        </summary>
        <ScrollRegion className="mt-2 max-h-[300px] overflow-auto" label={t("cf.table")}>
          <Table
            caption={chart.plain}
            head={chart.table.head.map((cell) => (
              <Th key={cell}>{cell}</Th>
            ))}
          >
            {chart.table.rows.map((row) => (
              <Tr key={row[0]}>
                {row.map((cell, index) => (
                  <Td key={chart.table.head[index]}>
                    <span className="tabular-nums">{cell}</span>
                  </Td>
                ))}
              </Tr>
            ))}
          </Table>
        </ScrollRegion>
      </details>
      <p className="mt-4">
        <a href={chart.csvHref} download className={buttonLink({ intent: "secondary" })}>
          <Icon name="csv" />
          {t("case.download")}
        </a>
      </p>
    </ReadingSection>
  );
}

export function SureSection({ reading, translator }: SectionProps) {
  const { sure } = reading;
  return (
    <ReadingSection id="cf-sure" title={translator.t("cf.s.sure")}>
      <ToneScale level={sure.level} tone={sure.tone} word={sure.word} />
      <div className="mt-1.5">
        <Plain>{sure.plain}</Plain>
      </div>
      <ExactList rows={sure.exact} />
    </ReadingSection>
  );
}

export function NotSaySection({ reading, translator }: SectionProps) {
  return (
    <ReadingSection id="cf-not" title={translator.t("case.not")} look="dashed">
      <ul className="text-body-m text-text-secondary grid list-disc gap-1.5 ps-5">
        {reading.notSay.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </ReadingSection>
  );
}

export function WhySection({ reading }: SectionProps) {
  const { why } = reading;
  if (!why) return null;
  const body = (
    <>
      <p className="text-label-m text-text-secondary flex items-center gap-2">
        <Icon name="info" />
        {why.tag}
      </p>
      <Plain>{why.plain}</Plain>
      {why.more ? <p className="text-body-m text-text-secondary max-w-[60ch]">{why.more}</p> : null}
      {why.breaks?.length ? (
        <ul className="grid gap-2">
          {why.breaks.map((item) => (
            <li key={item.year} className="text-body-m flex gap-4">
              <span className="font-display font-semibold tabular-nums">{item.year}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {why.link ? (
        <p>
          <a href={why.link.href} className={buttonLink({ intent: "secondary" })}>
            <Icon name="audit" />
            {why.link.label}
          </a>
        </p>
      ) : null}
    </>
  );
  return (
    <section aria-labelledby="cf-why" className="flex scroll-mt-20 flex-col gap-2.5">
      <h2 id="cf-why" className="text-heading-h3 font-display text-text-primary font-semibold">
        {why.title}
      </h2>
      <EvidenceBlock tone={(why.theme && THEME_TONE[why.theme]) || "stone"}>{body}</EvidenceBlock>
    </section>
  );
}

export function SourceSection({ reading, translator }: SectionProps) {
  const { t, locale } = translator;
  const { data } = reading;
  const newTabHint = t("link.newTab");
  return (
    <ReadingSection id="cf-source" title={t("cf.s.source")}>
      <Plain>{data.plain}</Plain>
      <dl className="mt-3.5 grid gap-2">
        {data.rows.map((row) => (
          <div
            key={row.label}
            className="medium:grid-cols-[minmax(140px,200px)_minmax(0,1fr)] grid gap-x-4 gap-y-0.5"
          >
            <dt className="text-body-s text-text-secondary">{row.label}</dt>
            <dd className="font-mono text-[13px] break-words">
              {row.href ? (
                <ExternalLink href={row.href} newTabHint={newTabHint}>
                  {row.value}
                </ExternalLink>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {data.orbit.length ? (
        <figure className="mt-4 flex flex-col gap-2">
          <div className="medium:grid-cols-2 grid gap-3">
            {data.orbit.map((image) => (
              <div key={image.date} className="flex flex-col gap-1">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={480}
                  height={480}
                  unoptimized
                  className="bg-bg-surface-sunken rounded-field aspect-square h-auto w-full"
                />
                <span className="text-body-s text-text-secondary text-center tabular-nums">
                  {formatDate(image.date, locale)}
                </span>
              </div>
            ))}
          </div>
          <figcaption className="text-body-s text-text-secondary">{t("cf.orbit.d")}</figcaption>
        </figure>
      ) : null}
    </ReadingSection>
  );
}
