import { LOCALIZED_PATHS, type Locale } from "@/lib/i18n/core";
import { seo } from "@/lib/i18n/messages/seo";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// What the home page is, for search engines: a free web app and the site it
// belongs to. Only features the product actually has go in featureList.
export default function HomeJsonLd({ locale }: { locale: Locale }) {
  const s = seo[locale];
  const url = `${SITE_URL}${LOCALIZED_PATHS.home[locale]}`;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url,
      inLanguage: locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url,
      description: s.homeDescription,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      inLanguage: locale,
      featureList: s.features,
      offers: { "@type": "Offer", price: "0", priceCurrency: locale === "ru" ? "RUB" : "USD" },
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
