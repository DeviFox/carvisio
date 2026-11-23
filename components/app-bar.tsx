"use client";

import Link from "next/link";
import styles from "@/app/page.module.css";
import { GarageIcon, HelpIcon, SettingsIcon } from "./icons";
import AccountControl from "./account-control";
import ThemeToggle from "./theme-toggle";
import LanguageSwitch from "./language-switch";
import { useLocale, useT } from "@/lib/i18n/react";
import { LOCALIZED_PATHS } from "@/lib/i18n";

type Props = {
  // Below the garage the garage icon is the way home; on the garage it marks where you are.
  home?: boolean;
  // Opens the "how carvisio works" story.
  onHelp?: () => void;
  // Auth pages: "Войти" would only point at the page you are on, and the
  // "скоро" settings gear is noise next to a form. Brand and the way home stay.
  bare?: boolean;
};

// Desktop: a slim row in the page's top margin, not a separate header.
// Phones keep their own top bar with the page's primary action.
export default function AppBar({ home, onHelp, bare }: Props) {
  const t = useT();
  return (
    <div className={styles.appBar}>
      <nav className={styles.brand} aria-label={t.garage.sections}>
        <span className={styles.brandMark} aria-hidden="true">c</span>
        <span className={styles.brandName}>carvisio</span>
        {/* Next to the brand, where the eye starts: the way back to the garage. */}
        {home ? (
          <Link href="/" className={styles.toolBtn} aria-label={t.garage.toGarage} title={t.garage.toGarage}>
            <GarageIcon />
          </Link>
        ) : (
          <span className={`${styles.toolBtn} ${styles.toolCurrent}`} aria-current="page" aria-label={t.garage.garage} title={t.garage.garage}>
            <GarageIcon />
          </span>
        )}
      </nav>
      <div className={styles.appTools}>
        {onHelp ? (
          <button type="button" className={styles.toolBtn} onClick={onHelp} aria-label={t.garage.howItWorks} title={t.garage.howItWorks}>
            <HelpIcon />
          </button>
        ) : null}
        {/* Kept on auth pages too: a dark-room visitor should not get a white form. */}
        <LanguageSwitch />
        <ThemeToggle />
        {bare ? null : (
          <>
            <AccountControl />
            <span className={styles.settingsSoon} role="img" aria-label={t.garage.settingsSoon} title={t.garage.settingsSoonTitle}>
              <SettingsIcon />
              <span className={styles.soonBadge} aria-hidden="true">{t.garage.soon}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Page footer: the journal article, the language on phones, the version.
export function VersionTag() {
  const t = useT();
  const locale = useLocale();
  return (
    <footer className={styles.version}>
      <nav className={styles.footerLinks} aria-label={t.garage.aboutNav}>
        <Link href={LOCALIZED_PATHS.journal[locale]}>{t.garage.journalLink}</Link>
        <Link href={LOCALIZED_PATHS.costs[locale]}>{t.garage.costsLink}</Link>
        <Link href={LOCALIZED_PATHS.parts[locale]}>{t.garage.partsLink}</Link>
      </nav>
      <LanguageSwitch variant="link" />
      <span className={styles.versionNumber}>v1.0.0 beta</span>
    </footer>
  );
}
