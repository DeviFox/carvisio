import type { Metadata, Viewport } from "next";
import RootDocument from "@/components/root-document";
import { seo } from "@/lib/i18n/messages/seo";
import { SITE_NAME, SITE_URL, ogBase } from "@/lib/seo";
import "../globals.css";

const { siteTitle, siteDescription } = seo.ru;

// No canonical or og:url here: every route would inherit them and point at "/".
// Pages that are meant to be indexed set their own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: siteTitle, template: `%s — ${SITE_NAME}` },
  description: siteDescription,
  robots: { index: true, follow: true },
  openGraph: { ...ogBase("ru"), title: siteTitle, description: siteDescription },
};

// Browser chrome follows the OS; the page itself also honours a manual choice.
export const viewport: Viewport = {
  // Draw under the notch and home indicator; the bars and sheets pad
  // themselves with env(safe-area-inset-*), which is 0 without this.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

// Root layout for the Russian pages and the app itself (which follows the
// visitor's stored language). The /en/ pages have their own in app/en.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="ru">{children}</RootDocument>;
}
