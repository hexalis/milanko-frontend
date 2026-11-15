import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { PageShell } from "@/shared/ui/page-shell";
import { TextLink } from "@/shared/ui/text-link";
import { teamMembers } from "../domain/team";
import { TeamList } from "./team-list";

/* Team page (POC renderTeam, app.js L2843): a short intro, then one card per person, lead first. */

export function TeamScreen({ translator }: { translator: Translator }) {
  const { t } = translator;
  const total = teamMembers(translator.locale).length;
  return (
    <PageShell kicker={t("nav.team")} title={t("team.title")} lead={t("team.lead2")}>
      <p className="text-body-m text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
        <Icon name="team" />
        <span>{total === 1 ? t("team.count1") : t("team.count", { n: total })}</span>
        <span aria-hidden="true">·</span>
        <TextLink href="/method">
          {t("team.howLink")} <Icon name="arrow-right" size="sm" />
        </TextLink>
      </p>
      <h2 id="team-members" className="sr-only">
        {t("team.members")}
      </h2>
      <TeamList translator={translator} labelledBy="team-members" />
    </PageShell>
  );
}
