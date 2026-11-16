import type { Translator } from "@/shared/lib/i18n";
import { teamMembers } from "../domain/team";
import { HexalisStage } from "./hexalis-banner";
import { TeamList } from "./team-list";

/*
 * Team page (POC renderTeam, app.js L2843): the whole page is one Hexalis stage. It says whose
 * project this is, holds one card per person (lead first), explains the portal, and leads out to
 * Hexalis, the organization behind it.
 */

export function TeamScreen({ translator }: { translator: Translator }) {
  return (
    <main className="max-w-content-max medium:px-6 expanded:px-12 mx-auto w-full px-4 pb-12">
      <HexalisStage
        translator={translator}
        titleId="team-title"
        count={teamMembers(translator.locale).length}
      >
        <TeamList translator={translator} labelledBy="team-members" />
      </HexalisStage>
    </main>
  );
}
