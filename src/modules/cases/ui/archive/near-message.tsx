import type { ReactNode } from "react";
import type { Translator } from "@/shared/lib/i18n";
import { Icon } from "@/shared/ui/icon";
import { roundKm, shortPlaceName, type NearPlace } from "../../domain/near";

/*
 * Above the list when a place is set (POC drawNear): how near the closest file is, or that a typed
 * place could not be found. The POC's live "Your place" link and region cautions are not ported.
 */

const STRONG = /<strong>(.*?)<\/strong>/;

/** The near.* copy marks the place name with <strong>; the name itself is plain text. */
function withStrong(text: string): ReactNode {
  const [before = "", inner = "", after = ""] = text.split(STRONG);
  return (
    <>
      {before}
      <strong>{inner}</strong>
      {after}
    </>
  );
}

type NearMessageProps =
  | { kind: "place"; place: NearPlace; km: number; isFar: boolean; translator: Translator }
  | { kind: "not-found"; text: string; translator: Translator };

export function NearMessage(props: NearMessageProps) {
  const { t, locale } = props.translator;
  const isFar = props.kind === "place" && props.isFar;
  const body =
    props.kind === "not-found"
      ? t("near.notfound", { q: props.text })
      : isFar
        ? withStrong(
            t("near.far", {
              name: shortPlaceName(props.place),
              km: roundKm(props.km).toLocaleString(locale),
            }),
          )
        : withStrong(t("near.close", { name: shortPlaceName(props.place) }));
  return (
    <div
      aria-live="polite"
      className="rounded-card bg-status-info-bg text-text-primary text-body-m flex items-start gap-3 p-4"
    >
      <span className="text-status-info-fg mt-0.5">
        <Icon name={props.kind === "place" && !isFar ? "map-pin" : "info-on"} />
      </span>
      <p>{body}</p>
    </div>
  );
}
