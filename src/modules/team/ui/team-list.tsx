import type { Translator } from "@/shared/lib/i18n";
import { teamMembers } from "../domain/team";
import { MemberCard } from "./member-card";

type TeamListProps = {
  translator: Translator;
  /** Id of the heading that names the list. */
  labelledBy: string;
};

/** Every member as a numbered case-file card, lead first. */
export function TeamList({ translator, labelledBy }: TeamListProps) {
  const members = teamMembers(translator.locale);
  return (
    <ul
      className="medium:grid-cols-2 expanded:grid-cols-3 grid grid-cols-1 gap-4"
      aria-labelledby={labelledBy}
    >
      {members.map((member, index) => (
        <MemberCard
          key={`${member.name}-${member.initials}`}
          member={member}
          folio={index + 1}
          translator={translator}
        />
      ))}
    </ul>
  );
}
