import Link from "next/link";
import LanguageSwitch from "@/components/language-switch";
import { LOCALIZED_PATHS, type Locale } from "@/lib/i18n/core";
import { seo, type LandingPage } from "@/lib/i18n/messages/seo";
import { LocaleProvider } from "@/lib/i18n/react";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import styles from "./landing-article.module.css";

const LANDINGS = ["journal", "costs", "parts"] as const satisfies readonly LandingPage[];

// A landing article about one thing carvisio does, rendered at a URL per
// language. Content lives in lib/i18n/messages/seo.ts.
export default function LandingArticle({ page, locale }: { page: LandingPage; locale: Locale }) {
  const s = seo[locale];
  const t = s.pages[page];
  const garage = LOCALIZED_PATHS.home[locale];

  // Shared by the visible FAQ and its FAQPage markup so the two never drift apart.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: t.title,
      description: t.description,
      url: `${SITE_URL}${LOCALIZED_PATHS[page][locale]}`,
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: t.faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <LocaleProvider fixed={locale} alternates={LOCALIZED_PATHS[page]}>
      <main className={styles.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header className={styles.header}>
          <Link href={garage} className={styles.brand} aria-label={s.brandAria}>
            <span className={styles.mark} aria-hidden="true">c</span>
            <span>carvisio</span>
          </Link>
          <div className={styles.headerActions}>
            <LanguageSwitch />
            <Link href={garage} className={styles.headerLink}>{s.openGarage}</Link>
          </div>
        </header>

        <article>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className={styles.lead}>{t.lead}</p>
            <Link href={garage} className={styles.cta}>{t.cta}</Link>
            <p className={styles.note}>{t.note}</p>
          </section>

          <section className={styles.section} aria-labelledby="features-title">
            <h2 id="features-title">{t.featuresTitle}</h2>
            <p>{t.featuresLead}</p>
            <div className={styles.cards}>
              {t.features.map((feature) => (
                <section className={styles.card} key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </section>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="how-title">
            <h2 id="how-title">{t.howTitle}</h2>
            <ol className={styles.steps}>
              {t.steps.map((step) => (
                <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>
              ))}
            </ol>
          </section>

          <section className={styles.section} aria-labelledby="faq-title">
            <h2 id="faq-title">{t.faqTitle}</h2>
            <div className={styles.faq}>
              {t.faq.map(({ q, a }) => [<h3 key={`${q}-q`}>{q}</h3>, <p key={`${q}-a`}>{a}</p>])}
            </div>
          </section>
        </article>

        <footer className={styles.footer}>
          <span>{s.footer}</span>
          <nav className={styles.related} aria-label={s.related}>
            {LANDINGS.filter((p) => p !== page).map((p) => (
              <Link key={p} href={LOCALIZED_PATHS[p][locale]}>{s.pages[p].navTitle}</Link>
            ))}
            <Link href={garage}>{s.back}</Link>
          </nav>
        </footer>
      </main>
    </LocaleProvider>
  );
}
