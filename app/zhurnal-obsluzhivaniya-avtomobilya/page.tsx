import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

const title = "Журнал обслуживания автомобиля онлайн";
const description =
  "Записывайте обслуживание и ремонты, храните историю пробега и следите за ресурсом деталей автомобиля в Carvisio.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/zhurnal-obsluzhivaniya-avtomobilya/" },
  openGraph: { title: `${title} — Carvisio`, description, url: "/zhurnal-obsluzhivaniya-avtomobilya/" },
};

const features = [
  {
    title: "История обслуживания",
    text: "Записывайте замену деталей, ремонт и осмотр с датой, пробегом, стоимостью и заметками. Прошлые записи остаются в истории автомобиля.",
  },
  {
    title: "Ресурс деталей",
    text: "Укажите пробег или срок службы установленной детали. Carvisio покажет, сколько ресурса осталось по вашим данным.",
  },
  {
    title: "Состояние автомобиля",
    text: "Отмечайте системы и детали, которым нужно внимание. Если данных не хватает, журнал так и покажет — без выдуманной оценки состояния.",
  },
];

export default function JournalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Carvisio — в гараж">
          <span className={styles.mark} aria-hidden="true">c</span>
          <span>carvisio</span>
        </Link>
        <Link href="/" className={styles.headerLink}>Открыть гараж</Link>
      </header>

      <article>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Личный журнал автомобиля</p>
          <h1>Журнал обслуживания автомобиля онлайн</h1>
          <p className={styles.lead}>
            Carvisio помогает вести историю обслуживания автомобиля в одном месте: фиксировать
            пробег, замены, ремонты и осмотры, а затем возвращаться к этим записям, когда нужно
            понять, что и когда делали.
          </p>
          <Link href="/" className={styles.cta}>Начать вести журнал</Link>
          <p className={styles.note}>Начать можно без регистрации. Записи сохраняются в гараже.</p>
        </section>

        <section className={styles.section} aria-labelledby="features-title">
          <h2 id="features-title">История работ, пробег и состояние автомобиля</h2>
          <p>
            Бумажная сервисная книжка часто теряется, а записи в заметках трудно связать с конкретной
            деталью. В Carvisio у каждой машины своя история: что меняли, при каком пробеге и какие
            компоненты установлены сейчас.
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
          <h2 id="how-title">Как вести журнал обслуживания</h2>
          <ol className={styles.steps}>
            <li><strong>Добавьте автомобиль</strong><span>Укажите марку, модель и текущий пробег.</span></li>
            <li><strong>Запишите работы</strong><span>Добавляйте замены, ремонты и осмотры по мере их выполнения.</span></li>
            <li><strong>Следите за деталями</strong><span>Задайте ресурс компонента по пробегу или сроку и обновляйте историю после обслуживания.</span></li>
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="faq-title">
          <h2 id="faq-title">Частые вопросы</h2>
          <div className={styles.faq}>
            <h3>Это журнал обслуживания или диагностика автомобиля?</h3>
            <p>Это журнал ваших записей и ориентир по заданному ресурсу деталей. Carvisio не подключается к автомобилю и не заменяет техническую диагностику.</p>
            <h3>Можно ли вести несколько автомобилей?</h3>
            <p>Да. Для каждой машины сохраняется собственная история работ и установленных компонентов.</p>
            <h3>Нужно ли регистрироваться?</h3>
            <p>Нет, начать можно сразу. Гостевой гараж хранится на устройстве; после регистрации его можно перенести в аккаунт и синхронизировать.</p>
          </div>
        </section>
      </article>

      <footer className={styles.footer}>
        <span>carvisio — журнал обслуживания автомобиля</span>
        <Link href="/">Перейти в гараж</Link>
      </footer>
    </main>
  );
}
