"use client";

import { useEffect } from "react";
import { recordCaseOpened } from "../hooks/use-case-progress";

/** Notes in the reader's storage that this case file was opened (rail progress and Recent). */
export function CaseVisitRecorder({ id }: { id: string }) {
  useEffect(() => {
    recordCaseOpened(id);
  }, [id]);
  return null;
}
