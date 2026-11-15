import { formatFigure, formatP, GlossaryTerm, type TrendCase } from "@/modules/cases";
import type { Translator } from "@/shared/lib/i18n";
import { unitText } from "../domain/guided";
import type { ScienceRow } from "./guided-parts";

/* Rows of the scientific depth (POC ask.js .ask-sci lists): the test's own numbers, monospaced. */

export function testRow(file: TrendCase, translator: Translator): ScienceRow {
  const { t } = file;
  return {
    key: "test",
    term: (
      <GlossaryTerm term="mk" label={translator.t("case.detail.test")} translator={translator} />
    ),
    value: `S = ${t.s} · Z = ${t.z.toFixed(2)} · τ = ${t.tau.toFixed(2)} · p ${formatP(t.p)}`,
  };
}

/** The Sen slope per year and its 95 % range per decade. */
export function slopeRows(file: TrendCase, translator: Translator): ScienceRow[] {
  const { t } = file;
  const unit = unitText(file.unit, translator.locale);
  const digits = file.digits + 1;
  return [
    {
      key: "slope",
      term: (
        <GlossaryTerm
          term="theilsen"
          label={translator.t("case.detail.slope")}
          translator={translator}
        />
      ),
      // The POC wrote "/yr" here; "per year" (unit.year) is the closest existing key.
      value: `${formatFigure(t.slope, file.digits + 2, true)} ${unit} ${translator.t("unit.year")}`,
    },
    {
      key: "ci",
      term: translator.t("case.detail.ci"),
      value: `[${formatFigure(t.slopeLow * 10, digits, true)}, ${formatFigure(t.slopeHigh * 10, digits, true)}] ${unit} ${translator.t("unit.decade")}`,
    },
  ];
}

export function snrAndCountRows(file: TrendCase, translator: Translator): ScienceRow[] {
  return [
    { key: "snr", term: translator.t("case.appendix.snr"), value: `${file.t.snr.toFixed(1)}×` },
    { key: "n", term: translator.t("case.detail.n"), value: `n = ${file.t.n}` },
  ];
}
