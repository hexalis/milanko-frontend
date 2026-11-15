import { BadgeLabel, BadgeRoot } from "@/shared/ui/hexalis";

type EnvironmentName = "local" | "develop" | "qa" | "production";

const TONES = {
  local: "closed",
  develop: "info",
  qa: "due",
  production: "ok",
} as const satisfies Record<EnvironmentName, string>;

/** Shows which deployment the user is on, so develop and QA are never mistaken for production. */
type EnvironmentBadgeProps = {
  environment: EnvironmentName;
  /** Tooltip naming what the badge is, in the reader's language. */
  label: string;
};

export function EnvironmentBadge({ environment, label }: EnvironmentBadgeProps) {
  return (
    <BadgeRoot tone={TONES[environment]} variant="outline" title={label}>
      <BadgeLabel className="font-mono">{environment}</BadgeLabel>
    </BadgeRoot>
  );
}
