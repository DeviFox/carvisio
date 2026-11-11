import type { Metadata } from "next";

export const SITE_URL = "https://carvisio.pro";
export const SITE_NAME = "carvisio";

// Next replaces a parent's openGraph wholesale instead of merging it, so every
// page that sets its own openGraph spreads this in to keep type, locale and name.
export const OG_BASE = {
  type: "website",
  locale: "ru_RU",
  siteName: SITE_NAME,
  images: [
    {
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "carvisio — история обслуживания автомобиля",
    },
  ],
} satisfies NonNullable<Metadata["openGraph"]>;
