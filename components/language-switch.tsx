"use client";

import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";
import { setLocale, storeLocale, type Locale } from "@/lib/i18n";
import { usePageLocale, useLocale, useT } from "@/lib/i18n/react";

const OTHER: Record<Locale, Locale> = { ru: "en", en: "ru" };

const NATIVE_NAME: Record<Locale, string> = { ru: "Русский", en: "English" };

// Names the language a press switches to: "EN" as a tool button in the
// desktop bar, "English" as a footer link on phones, where the top bar has no
// room. Pages with a URL per language go to the other URL; the app switches
// in place and remembers the choice.
export default function LanguageSwitch({ variant = "tool" }: { variant?: "tool" | "link" }) {
  const t = useT();
  const locale = useLocale();
  const { alternates } = usePageLocale();
  const router = useRouter();
  const next = OTHER[locale];
  const target = alternates?.[next];

  return (
    <button
      type="button"
      className={variant === "tool" ? `${styles.toolBtn} ${styles.langBtn}` : styles.langLink}
      lang={next}
      onClick={() => {
        // The other URL renders in its own language; this page stays as it is until then.
        if (target) {
          storeLocale(next);
          router.push(target);
        } else {
          setLocale(next);
        }
      }}
      aria-label={t.garage.language.switchTo}
      title={t.garage.language.switchTo}
    >
      {variant === "tool" ? next.toUpperCase() : NATIVE_NAME[next]}
    </button>
  );
}
