import type { Translator } from "@/shared/lib/i18n";
import { tourLabels, tourSteps, tourWaitStep, type TourId } from "../domain/tours";
import { TourButton } from "./tour-button";

type PageTourProps = {
  id: TourId;
  translator: Translator;
  /** Icon only, the label unfolding on hover (over the globe, where room is scarce). */
  isCompact?: boolean;
};

/** A page's tour button, with its copy resolved on the server in the reader's language. */
export function PageTour({ id, translator, isCompact }: PageTourProps) {
  const { t } = translator;
  return (
    <TourButton
      steps={tourSteps(id, t)}
      wait={tourWaitStep(id, t)}
      labels={tourLabels(t)}
      isCompact={isCompact}
    />
  );
}
