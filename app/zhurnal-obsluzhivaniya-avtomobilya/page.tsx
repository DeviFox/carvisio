import type { Metadata } from "next";
import Link from "next/link";
import { OG_BASE, SITE_NAME, SITE_URL } from "@/lib/seo";
import styles from "./page.module.css";

const PATH = "/zhurnal-obsluzhivaniya-avtomobilya/";
const title = "Журнал обслуживания автомобиля онлайн";
const description =
  "Фиксируйте пробег, замены и ремонты. Carvisio хранит историю обслуживания каждого автомобиля и помогает следить за ресурсом деталей.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH },
  openGraph: { ...OG_BASE, title: `${title} — ${SITE_NAME}`, description, url: PATH },
};

const features = [
  {
    title: "Работы и расходы",
    text: "Добавьте обслуживание, ремонт или осмотр. Для каждой записи можно указать дату, пробег, стоимость и комментарий.",
  },
  {
    title: "Детали и их ресурс",
    text: "Запишите, какую деталь установили и когда. Укажите срок службы — Carvisio рассчитает остаток по пробегу или времени.",
  },
  {
    title: "Состояние деталей",
    text: "Отмечайте детали, которым требуется внимание. Если срок службы не указан, приложение покажет, что данных пока недостаточно.",
  },
];

// Shared by the visible FAQ and its FAQPage markup so the two never drift apart.
const faq = [
  {
    q: "Carvisio определяет техническое состояние автомобиля?",
    a: "Нет. Приложение не получает данные с автомобиля и не заменяет диагностику. Статус деталей и расчёт ресурса основаны на информации, которую вы внесли.",
  },
  {
    q: "Можно вести несколько автомобилей?",
    a: "Да. Для каждого автомобиля хранится отдельная история работ и список установленных деталей.",
  },
  {
    q: "Нужна регистрация?",
    a: "Нет, начать можно без аккаунта. Позже гараж можно перенести в аккаунт и открывать на других устройствах.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    inLanguage: "ru",
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

export default function JournalPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="carvisio — в гараж">
          <span className={styles.mark} aria-hidden="true">c</span>
          <span>carvisio</span>
        </Link>
        <Link href="/" className={styles.headerLink}>Открыть гараж</Link>
      </header>

      <article>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Обслуживание автомобиля</p>
          <h1>Журнал обслуживания автомобиля онлайн</h1>
          <p className={styles.lead}>
            Записывайте обслуживание, ремонты и осмотры. Для каждой работы можно указать дату,
            пробег, стоимость и добавить комментарий.
          </p>
          <Link href="/" className={styles.cta}>Перейти в гараж</Link>
          <p className={styles.note}>Регистрация не нужна, чтобы начать. Без аккаунта данные остаются на этом устройстве.</p>
        </section>

        <section className={styles.section} aria-labelledby="features-title">
          <h2 id="features-title">У каждой машины — своя история работ</h2>
          <p>
            Добавляйте ремонты, замены и осмотры по мере их выполнения. В истории останутся дата и
            пробег — к ним можно вернуться позже.
          </p>
          <div className={styles.cards}>
            {features.map((feature) => (
              <section className={styles.card} key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </section>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="how-title">
          <h2 id="how-title">Как начать</h2>
          <ol className={styles.steps}>
            <li><strong>Добавьте автомобиль</strong><span>Укажите марку, модель и текущий пробег.</span></li>
            <li><strong>Запишите работы</strong><span>Добавьте недавние и известные прошлые работы. Можно начать с последней записи.</span></li>
            <li><strong>Добавьте детали</strong><span>Укажите установленные компоненты и срок службы, если он известен.</span></li>
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="faq-title">
          <h2 id="faq-title">Вопросы и ответы</h2>
          <div className={styles.faq}>
            {faq.map(({ q, a }) => [<h3 key={`${q}-q`}>{q}</h3>, <p key={`${q}-a`}>{a}</p>])}
          </div>
        </section>
      </article>

      <footer className={styles.footer}>
        <span>carvisio · история работ и деталей вашей машины</span>
        <Link href="/">Вернуться в гараж</Link>
      </footer>
    </main>
  );
}
