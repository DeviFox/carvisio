import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { YandexMetrika } from "@/components/yandex-metrika";
import { GoogleTag } from "@/components/google-tag";
import GarageSync from "@/components/garage-sync";
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const TITLE = "carvisio — история обслуживания автомобиля";
const DESCRIPTION =
  "Записывайте пробег, ремонт и замену деталей, чтобы история обслуживания автомобиля всегда была под рукой.";

// No canonical or og:url here: every route would inherit them and point at "/".
// Pages that are meant to be indexed set their own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s — ${SITE_NAME}` },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: { ...OG_BASE, title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <GarageSync />
        <YandexMetrika />
        <GoogleTag />
      </body>
    </html>
  );
}
