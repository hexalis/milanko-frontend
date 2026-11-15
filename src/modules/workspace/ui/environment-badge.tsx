import { tv } from "tailwind-variants";

export type EnvironmentName = "local" | "develop" | "qa" | "production";

const badge = tv({
  base: "inline-flex min-h-8 items-center rounded-md px-3 font-mono text-xs font-bold",
  variants: {
    environment: {
      local: "bg-surface-soft text-ink-soft",
      develop: "bg-block-tide text-signal-down",
      qa: "bg-block-rose text-signal-up",
      production: "bg-accent-soft text-accent",
    },
  },
});

/** Shows which deployment the user is on, so develop and QA are never mistaken for production. */
export function EnvironmentBadge({ environment }: { environment: EnvironmentName }) {
  return (
    <span className={badge({ environment })} title="Ambiente">
      {environment}
    </span>
  );
}
