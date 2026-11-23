import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { YandexMetrika } from "@/components/yandex-metrika";
import { GoogleTag } from "@/components/google-tag";
import GarageSync from "@/components/garage-sync";
import { LocaleProvider } from "@/lib/i18n/react";
import { LOCALE_BOOT_SCRIPT, type Locale } from "@/lib/i18n/core";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

// The <html> shell shared by the root layouts, one per language: Russian
// pages and the /en/ pages differ only in <html lang> and their metadata.
export default function RootDocument({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return (
    // data-theme (and data-locale-pending) are set by the boot scripts before
    // React hydrates, hence the warning opt-out.
    <html lang={lang} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      {/* A root layout's own <head>; the rule targets pages/_document. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script src="https://yandex.ru/ads/system/context.js" async />
        <script data-page-id="20487741" src="https://yandex.ru/ads/system/ap-loader.js" async />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider>
          {children}
          <GarageSync />
        </LocaleProvider>
        <YandexMetrika />
        <GoogleTag />
      </body>
    </html>
  );
}
