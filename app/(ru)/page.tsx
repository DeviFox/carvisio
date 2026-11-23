import type { Metadata } from "next";
import { seo } from "@/lib/i18n/messages/seo";
import { localizedAlternates, ogBase } from "@/lib/seo";
import HomeJsonLd from "@/components/home-json-ld";
import HomeClient from "./home-client";

// The garage itself is a client component; this server wrapper exists so the
// home page can own its canonical and og:url instead of the root layout, which
// every other route would inherit. Its language follows the visitor's choice
// (Russian for a first visit and for crawlers); /en/ is the English copy.
const { homeTitle, homeDescription } = seo.ru;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: localizedAlternates("home", "ru"),
  openGraph: { ...ogBase("ru"), title: homeTitle, description: homeDescription, url: "/" },
};

export default function Page() {
  return (
    <>
      <HomeJsonLd locale="ru" />
      <HomeClient />
    </>
  );
}
