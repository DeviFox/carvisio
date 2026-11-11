import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { YandexMetrika } from "@/components/yandex-metrika";
import { GoogleTag } from "@/components/google-tag";
import GarageSync from "@/components/garage-sync";
import "./globals.css";

const TITLE = "Carvisio — журнал обслуживания автомобиля и история ремонтов";
const DESCRIPTION =
  "Онлайн-журнал обслуживания автомобиля: записывайте замены, ремонты, пробег и расходы, следите за ресурсом деталей и состоянием систем автомобиля.";

export const metadata: Metadata = {
  metadataBase: new URL("https://carvisio.pro"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "carvisio",
    title: TITLE,
    description: DESCRIPTION,
    url: "https://carvisio.pro/",
  },
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
