"use client";

import { useSyncExternalStore } from "react";
import styles from "@/app/page.module.css";
import { getPref, setPref, subscribe, ThemePref } from "@/lib/theme";
import { MoonIcon, SunIcon, ThemeAutoIcon } from "./icons";
import { useT } from "@/lib/i18n/react";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };

const ICON: Record<ThemePref, () => React.ReactElement> = {
  system: () => <ThemeAutoIcon />,
  light: () => <SunIcon />,
  dark: () => <MoonIcon />,
};

// One tool button that steps system → light → dark. The icon shows the current
// choice; the label says both the choice and what a press does next.
export default function ThemeToggle() {
  // The server has no stored choice; "system" there, the real one after hydration.
  const pref = useSyncExternalStore(subscribe, getPref, () => "system" as const);
  const { theme } = useT().garage;
  const label = theme.label(theme.now[pref], theme.next[pref]);
  return (
    <button
      type="button"
      className={styles.toolBtn}
      onClick={() => setPref(NEXT[pref])}
      aria-label={label}
      title={label}
    >
      {ICON[pref]()}
    </button>
  );
}
