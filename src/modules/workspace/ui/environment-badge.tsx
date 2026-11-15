import { BadgeLabel, BadgeRoot } from "@/shared/ui/hexalis";

export type EnvironmentName = "local" | "develop" | "qa" | "production";

const TONES = {
  local: "closed",
  develop: "info",
  qa: "due",
  production: "ok",
} as const satisfies Record<EnvironmentName, string>;

/** Shows which deployment the user is on, so develop and QA are never mistaken for production. */
export function EnvironmentBadge({ environment }: { environment: EnvironmentName }) {
  return (
    <BadgeRoot tone={TONES[environment]} variant="outline" title="Ambiente">
      <BadgeLabel className="font-mono">{environment}</BadgeLabel>
    </BadgeRoot>
  );
}
