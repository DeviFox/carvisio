// Interface language: the visitor's choice, kept in localStorage and mirrored
// on <html lang>. Plain module state, no React, so lib/ helpers (formatters,
// store validation) can read it too; components subscribe through useT().
//
// Static export, no middleware: the server render is always the default
// language (or a page's forced one), and the stored choice is applied after
// hydration. A boot script hides the page for that moment so it never flashes.

export type Locale = "ru" | "en";

export const LOCALES: readonly Locale[] = ["ru", "en"];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_KEY = "carvisio.locale";

// Pages with their own URL per language. Their language is fixed by the URL,
// except the Russian home: "/" is also the app's front door, so it follows the
// stored choice like any app page.
export const LOCALIZED_PATHS = {
  home: { ru: "/", en: "/en/" },
  journal: { ru: "/journal/", en: "/en/car-maintenance-log/" },
  costs: { ru: "/car-expenses/", en: "/en/car-expense-tracker/" },
  parts: { ru: "/part-replacement/", en: "/en/car-parts-service-life/" },
} as const satisfies Record<string, Record<Locale, string>>;

export function isLocale(v: unknown): v is Locale {
  return v === "ru" || v === "en";
}

// BCP 47 tag for Intl. en-GB for English: day-month dates and 24-hour time
// read naturally to most of the non-US world this product is for.
export function intlTag(locale: Locale = current): string {
  return locale === "ru" ? "ru-RU" : "en-GB";
}

let current: Locale = DEFAULT_LOCALE;
// Set when the page's URL fixes its language: the stored choice no longer moves it.
let pinned = false;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return current;
}

export function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
}

// Fixes the live language for a page whose URL carries it, without notifying
// anyone: called during its first render, so lib/ helpers agree with the
// components before any effect runs.
export function pinLocale(locale: Locale) {
  current = locale;
  pinned = true;
}

export function unpinLocale() {
  pinned = false;
}

export function isPinned(): boolean {
  return pinned;
}

export function setLocale(locale: Locale, opts: { persist?: boolean } = {}) {
  if (opts.persist !== false) storeLocale(locale);
  if (pinned) return;
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  if (locale === current) return;
  current = locale;
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Runs inline in <head>. When the stored language differs from the page's
// <html lang>, hides the page until LocaleProvider applies it (with a cap, so
// a failed script never leaves it blank). Localized pages are skipped.
const FIXED_PATHS = Object.values(LOCALIZED_PATHS)
  .flatMap((p) => Object.values(p))
  .filter((p) => p !== LOCALIZED_PATHS.home.ru);
export const LOCALE_BOOT_SCRIPT = `(function(){var h=document.documentElement,p=location.pathname,f=${JSON.stringify(FIXED_PATHS)};if(p.indexOf("/en/")===0||f.indexOf(p)>=0)return;var s;try{s=localStorage.getItem(${JSON.stringify(LOCALE_KEY)})}catch(e){}if((s==="ru"||s==="en")&&s!==h.lang){h.setAttribute("data-locale-pending","");setTimeout(function(){h.removeAttribute("data-locale-pending")},1500)}})()`;
