import type { Metadata } from "next";
import { LOCALIZED_PATHS, type Locale } from "./i18n/core";
import { seo, type LandingPage } from "./i18n/messages/seo";

export const SITE_URL = "https://carvisio.pro";
export const SITE_NAME = "carvisio";

const OG_LOCALE: Record<Locale, string> = { ru: "ru_RU", en: "en_GB" };
// Rendered at build time by app/og.png and app/og-en.png.
const OG_IMAGE: Record<Locale, string> = { ru: "/og.png", en: "/og-en.png" };

// Next replaces a parent's openGraph wholesale instead of merging it, so every
// page that sets its own openGraph spreads this in to keep type, locale and name.
export function ogBase(locale: Locale) {
  return {
    type: "website",
    locale: OG_LOCALE[locale],
    alternateLocale: Object.entries(OG_LOCALE)
      .filter(([l]) => l !== locale)
      .map(([, og]) => og),
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE[locale], width: 1200, height: 630, alt: seo[locale].og.alt }],
  } satisfies NonNullable<Metadata["openGraph"]>;
}

export const OG_BASE = ogBase("ru");

// canonical plus hreflang for a page that exists in every language.
// x-default points at Russian, the language the site started in.
export function localizedAlternates(page: keyof typeof LOCALIZED_PATHS, locale: Locale): Metadata["alternates"] {
  const paths = LOCALIZED_PATHS[page];
  return {
    canonical: paths[locale],
    languages: { ...paths, "x-default": paths.ru },
  };
}

// Title, description, hreflang and Open Graph for a landing article.
export function landingMetadata(page: LandingPage, locale: Locale): Metadata {
  const { title, description } = seo[locale].pages[page];
  const sep = locale === "ru" ? " — " : " · ";
  return {
    title,
    description,
    alternates: localizedAlternates(page, locale),
    openGraph: { ...ogBase(locale), title: `${title}${sep}${SITE_NAME}`, description, url: LOCALIZED_PATHS[page][locale] },
  };
}
