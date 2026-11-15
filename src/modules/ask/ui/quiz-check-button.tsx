"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

type QuizCheckButtonProps = {
  /** The quiz form this button submits (it sits outside it, in the dock). */
  formId: string;
  /**
   * Whether the server rendered a choice. The dock shows "Check" only while the quiz has no
   * answer in the URL, so it is false there; the first paint then matches the server.
   */
  isAnsweredOnServer?: boolean;
  className: string;
  children: ReactNode;
};

/**
 * "Check" stays inactive until a tile is chosen (POC lessonGo: aria-disabled). Inactive controls
 * are exempt from the contrast minimum; a faint button that still works would not be. Pressing it
 * early shows the browser's own "pick one" hint instead of doing nothing.
 */
export function QuizCheckButton({
  formId,
  isAnsweredOnServer = false,
  className,
  children,
}: QuizCheckButtonProps) {
  const [isAnswered, setIsAnswered] = useState(isAnsweredOnServer);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const sync = () => setIsAnswered(form.querySelector("input:checked") !== null);
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, [formId]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isAnswered) return;
    event.preventDefault();
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.reportValidity();
  }

  return (
    <button
      type="submit"
      form={formId}
      aria-disabled={isAnswered ? undefined : true}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}
