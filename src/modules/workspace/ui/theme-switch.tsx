"use client";

import { Icon } from "@/shared/ui/icon";
import { THEMES, type Theme } from "../domain/theme";
import { useTheme } from "../hooks/use-theme";

type ThemeSwitchProps = {
  /** Group name ("Appearance"). */
  label: string;
  optionLabels: Readonly<Record<Theme, string>>;
  /** In the rail the pair stacks when the rail is collapsed; the phone bar keeps it in a row. */
  placement: "rail" | "bar";
};

const GROUP = {
  rail: "rounded-control bg-bg-surface-sunken nav-collapsed:flex-col m-0 inline-flex min-w-0 gap-0.5 border-0 p-1",
  bar: "rounded-control bg-bg-surface-sunken m-0 inline-flex min-w-0 gap-0.5 border-0 p-1",
} as const;

const ICONS: Readonly<Record<Theme, string>> = { light: "sun", dark: "moon" };

/**
 * Light and dark buttons (POC .theme). The pressed one is known only once mounted, because the
 * pre-paint script chose it from storage or the device; until then neither claims to be pressed.
 */
export function ThemeSwitch({ label, optionLabels, placement }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className={GROUP[placement]}>
      <legend className="sr-only">{label}</legend>
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-label={optionLabels[option]}
          title={optionLabels[option]}
          aria-pressed={theme === null ? undefined : theme === option}
          onClick={() => {
            setTheme(option); // pins the pick even when it matches what the device shows
          }}
          className="text-icon-secondary hover:bg-bg-hover hover:text-icon-primary focus-visible:focus-ring focus-visible:outline-focus-ring aria-pressed:bg-bg-inverse aria-pressed:text-icon-inverse grid size-8 cursor-pointer place-items-center rounded-xs"
        >
          <Icon name={ICONS[option]} />
        </button>
      ))}
    </fieldset>
  );
}
