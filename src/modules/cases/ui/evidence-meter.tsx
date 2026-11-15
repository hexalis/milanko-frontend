import type { Strength } from "../domain/trend-stats";

const LEVELS: Record<Strength, number> = { weak: 1, moderate: 2, strong: 3 };
const BAR_HEIGHTS = ["h-[7px]", "h-[11px]", "h-[15px]"] as const;

type EvidenceMeterProps = {
  strength: Strength;
  /** The word beside the bars ("Strong evidence", or "Very unusual" for anomaly files). */
  word: string;
  /** Accessible name; defaults to the word. */
  label?: string;
  isWordHidden?: boolean;
};

/** Three ascending bars plus the word: never a percentage (DESIGN.md · evidence-scale). */
export function EvidenceMeter({ strength, word, label, isWordHidden = false }: EvidenceMeterProps) {
  const level = LEVELS[strength];
  return (
    <span className="text-label-m inline-flex items-end gap-2">
      <span className="sr-only">{label ?? word}</span>
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {BAR_HEIGHTS.map((height, index) => (
          <i
            key={height}
            className={`rounded-2xs block w-[5px] ${height} ${
              index < level
                ? strength === "weak"
                  ? "bg-trend-neutral"
                  : "bg-action-primary"
                : "bg-bg-surface-sunken"
            }`}
          />
        ))}
      </span>
      {isWordHidden ? null : <span aria-hidden="true">{word}</span>}
    </span>
  );
}
