import Link from "next/link";
import { tv } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { TextLink } from "@/shared/ui/text-link";
import { auditTitle } from "../../domain/audit-text";
import { caseFilePath } from "../../domain/case-reading";
import { auditFileId, type AuditCategory, type EventAudit } from "../../domain/event-audit";

/*
 * The catalog audit inside Case Files (`/cases?kind=audit`, POC auditHTML): one card per EONET
 * category with its verdict, each opening as an audit case file. The POC's per-card bar charts,
 * metric strip and jump bar live in the audit files themselves here.
 */

const stamp = tv({
  base: "inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap",
  variants: {
    verdict: {
      trend: "border-status-ok-border bg-status-ok-bg text-status-ok-fg",
      artifact: "border-status-review-border bg-status-review-bg text-status-review-fg",
      "no-trend": "border-dashed border-trend-neutral bg-bg-surface-sunken text-trend-neutral",
      insufficient: "border-dashed border-trend-neutral bg-bg-surface-sunken text-trend-neutral",
    },
  },
});

const STAMP_ICON: Record<AuditCategory["verdict"], string> = {
  trend: "confirmed",
  artifact: "warning",
  "no-trend": "inconclusive",
  insufficient: "inconclusive",
};

function AuditStamp({
  verdict,
  translator,
}: {
  verdict: AuditCategory["verdict"];
  translator: Translator;
}) {
  return (
    <span className={stamp({ verdict })}>
      <Icon name={STAMP_ICON[verdict]} size="sm" />
      {translator.t(`verdict.${verdict}`)}
    </span>
  );
}

type AuditIndexProps = { audit: EventAudit; translator: Translator; backHref: string };

export function AuditIndex({ audit, translator, backHref }: AuditIndexProps) {
  const { t } = translator;
  return (
    <section aria-labelledby="audit-title" className="flex flex-col gap-4">
      <p>
        <TextLink href={backHref}>
          <Icon name="arrow-left" /> {t("arch.audit.back")}
        </TextLink>
      </p>
      <h2 id="audit-title" className="text-heading-h2 font-display text-text-primary font-semibold">
        {t("audit.title")}
      </h2>
      <p className="text-body-l font-reading text-text-secondary max-w-[60ch]">{t("audit.lead")}</p>
      <ul className="medium:grid-cols-2 grid gap-3">
        {audit.categories.map((category) => (
          <li key={category.id}>
            <Link
              href={caseFilePath(auditFileId(category))}
              className="rounded-card bg-bg-surface shadow-card text-text-primary focus-visible:focus-ring focus-visible:outline-focus-ring duration-fast flex h-full flex-col gap-2 p-4 no-underline transition-transform hover:-translate-y-px"
            >
              <span className="text-body-m-strong font-display font-semibold">
                {auditTitle(category, translator)}
              </span>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <AuditStamp verdict={category.verdict} translator={translator} />
                <span className="text-label-s text-text-link inline-flex items-center gap-1">
                  {t("cf.audit.asfile")}
                  <Icon name="arrow-right" size="sm" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
