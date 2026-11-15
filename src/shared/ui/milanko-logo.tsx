/*
 * Milanko brand (manual v1.2, as the POC ships it): the isotype is an M on the Earth's 23.5° axis,
 * split by the anomaly node; the wordmark is drawn, not typeset. Both follow `currentColor`.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** The isotype. Decorative: the link around it carries the name. */
export function MilankoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="56 56 400 400" width={size} height={size} aria-hidden="true" focusable="false">
      <g {...STROKE} strokeWidth={48}>
        <path d="M88.3 384 L199.7 128 L219.6 242.6" />
        <path d="M282.5 263.3 L423.7 128 L312.3 384" />
      </g>
      <circle cx="231.7" cy="312" r="30.4" className="fill-[var(--milanko-node)]" />
    </svg>
  );
}

/** The drawn "MILANKO" wordmark. Decorative: pair it with visible or sr-only text. */
export function MilankoWordmark() {
  return (
    <svg
      viewBox="-10 -10 798 120"
      className="block h-[0.9em] w-auto"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth={18} strokeLinejoin="round">
        <path d="M0 100V0L48 58 96 0V100" />
        <path transform="translate(146 0)" d="M0 0V100" />
        <path transform="translate(196 0)" d="M0 0V100H60" />
        <path transform="translate(280 0)" d="M0 100 46 0 92 100" />
        <path transform="translate(422 0)" d="M0 100V0L80 100V0" />
        <path transform="translate(552 0)" d="M0 0V100M74 0 0 60M30 42 76 100" />
        <path transform="translate(678 0)" d="M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z" />
      </g>
    </svg>
  );
}
