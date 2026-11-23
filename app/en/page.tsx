import type { Metadata } from "next";
import HomeClient from "@/app/(ru)/home-client";
import HomeJsonLd from "@/components/home-json-ld";
import { LOCALIZED_PATHS } from "@/lib/i18n/core";
import { seo } from "@/lib/i18n/messages/seo";
import { LocaleProvider } from "@/lib/i18n/react";
import { localizedAlternates, ogBase } from "@/lib/seo";

const { homeTitle, homeDescription } = seo.en;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: localizedAlternates("home", "en"),
  openGraph: { ...ogBase("en"), title: homeTitle, description: homeDescription, url: LOCALIZED_PATHS.home.en },
};

// The same garage, in English whatever the stored choice.
export default function Page() {
  return (
    <LocaleProvider fixed="en" alternates={LOCALIZED_PATHS.home}>
      <HomeJsonLd locale="en" />
      <HomeClient />
    </LocaleProvider>
  );
}
