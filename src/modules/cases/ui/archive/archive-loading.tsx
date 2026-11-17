import type { CSSProperties } from "react";

/*
 * Shown while the case files load (the archive page's fallback): a folder takes in three sheets and
 * fans them out as three cards, in the archive's colours, with a bar that keeps its own pace like
 * the globe's loader (styles: archive-loading.css, imported by app/globals.css).
 */

/**
 * Each card: where it fans out to (x, turn) and its colours, those of a kind of case file. The
 * tokens are written out whole so Tailwind keeps them in the stylesheet.
 */
const CARDS = [
  {
    fx: "-46px",
    fr: "-12deg",
    face: "var(--color-surface-tone-1)",
    edge: "var(--color-surface-tone-1-edge)",
  },
  {
    fx: "0px",
    fr: "0deg",
    face: "var(--color-surface-tone-3)",
    edge: "var(--color-surface-tone-3-edge)",
  },
  {
    fx: "46px",
    fr: "12deg",
    face: "var(--color-surface-tone-4)",
    edge: "var(--color-surface-tone-4-edge)",
  },
] as const;

export function ArchiveLoading({ label }: { label: string }) {
  return (
    <output className="grid min-h-[60dvh] place-items-center pt-24">
      <span className="sr-only">{label}</span>
      <span className="fl" aria-hidden="true">
        <span className="fl-folder">
          <span className="fl-tab" />
          <span className="fl-back" />
          {CARDS.map((card, index) => (
            <span
              key={card.fx}
              className="fl-sheet"
              style={
                {
                  "--i": index,
                  "--fx": card.fx,
                  "--fr": card.fr,
                  "--fs": card.face,
                  "--fc": card.edge,
                } as CSSProperties
              }
            >
              <i />
              <i />
              <i />
            </span>
          ))}
          <span className="fl-cover" />
        </span>
        <span className="fl-bar">
          <i />
        </span>
      </span>
    </output>
  );
}
