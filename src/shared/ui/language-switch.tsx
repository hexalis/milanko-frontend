"use client";

import { useTransition } from "react";
import { LOCALES, type Locale } from "@/shared/lib/i18n";

type LanguageSwitchProps = {
  current: Locale;
  label: string;
  /** Persists the choice (a Server Action that sets the language cookie). */
  onSelect: (locale: Locale) => Promise<void>;
};

/** EN/ES toggle. The server re-renders the page in the chosen language. */
export function LanguageSwitch({ current, label, onSelect }: LanguageSwitchProps) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    if (locale === current) return;
    startTransition(() => onSelect(locale));
  }

  return (
    <fieldset aria-busy={isPending} className="bg-bg-canvas inline-flex rounded-sm border-0 p-1">
      <legend className="sr-only">{label}</legend>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === current}
          onClick={() => handleSelect(locale)}
          className="text-label-s text-text-secondary hover:bg-bg-hover focus-visible:focus-ring focus-visible:outline-focus-ring aria-pressed:bg-bg-inverse aria-pressed:text-text-inverse min-h-8 min-w-10 rounded-xs px-2.5 font-mono font-semibold uppercase"
        >
          {locale}
        </button>
      ))}
    </fieldset>
  );
}
