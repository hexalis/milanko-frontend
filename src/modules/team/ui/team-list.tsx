import { tv, type VariantProps } from "tailwind-variants";
import type { Translator } from "@/shared/lib/i18n";
import { teamMembers } from "../domain/team";
import { MemberCard } from "./member-card";

const list = tv({
  base: "m-0 list-none p-0",
  variants: {
    layout: {
      grid: "grid grid-cols-1 gap-4 medium:grid-cols-2 expanded:grid-cols-3",
      compact: "flex flex-col",
    },
  },
  defaultVariants: { layout: "grid" },
});

type TeamListProps = VariantProps<typeof list> & {
  translator: Translator;
  /** Id of the heading that names the list. */
  labelledBy: string;
};

/** Every member, lead first: a card grid on the team page, a compact list in the method aside. */
export function TeamList({ translator, labelledBy, layout = "grid" }: TeamListProps) {
  const members = teamMembers(translator.locale);
  return (
    <ul className={list({ layout })} aria-labelledby={labelledBy}>
      {members.map((member) => (
        <MemberCard
          key={`${member.name}-${member.initials}`}
          member={member}
          translator={translator}
          layout={layout ?? "grid"}
        />
      ))}
    </ul>
  );
}
