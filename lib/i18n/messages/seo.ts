import type { Locale } from "../core";

// Copy for the indexed pages (metadata, landing articles, the OG image).
// Server-only: kept out of the client dictionaries so the app bundle doesn't
// carry it. Every claim here must be something the product actually does.

type Landing = {
  // Short name for links between the landing pages.
  navTitle: string;
  title: string;
  description: string;
  eyebrow: string;
  lead: string;
  cta: string;
  note: string;
  featuresTitle: string;
  featuresLead: string;
  features: { title: string; text: string }[];
  howTitle: string;
  steps: { title: string; text: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
};

const ru = {
  siteTitle: "carvisio — история обслуживания автомобиля",
  siteDescription:
    "Записывайте пробег, ремонт и замену деталей, чтобы история обслуживания автомобиля всегда была под рукой.",
  homeTitle: "carvisio — журнал обслуживания автомобиля",
  homeDescription:
    "Записывайте пробег, ремонты и замены деталей. Для каждой машины хранится своя история работ и расходов. Начать можно без регистрации.",
  og: {
    title: "Журнал обслуживания автомобиля",
    subtitle: "Пробег, ремонты и замены деталей в одном журнале",
    alt: "carvisio — история обслуживания автомобиля",
  },
  features: [
    "История обслуживания: замены, ремонты, покупки и осмотры",
    "Ресурс деталей по пробегу и времени",
    "Учёт расходов по валютам",
    "Отчёт об истории обслуживания в PDF",
    "Несколько автомобилей, VIN или номер кузова",
  ],
  brandAria: "carvisio — в гараж",
  openGarage: "Открыть гараж",
  back: "Вернуться в гараж",
  footer: "carvisio · журнал работ и замен",
  related: "Ещё о carvisio",
  pages: {
    journal: {
      navTitle: "Журнал обслуживания",
      title: "Журнал обслуживания автомобиля онлайн",
      description:
        "Фиксируйте пробег, замены и ремонты. Carvisio хранит историю обслуживания каждого автомобиля и помогает следить за ресурсом деталей.",
      eyebrow: "Обслуживание автомобиля",
      lead: "Записывайте обслуживание, ремонты и осмотры. Для каждой работы можно указать дату, пробег, стоимость и добавить комментарий.",
      cta: "Перейти в гараж",
      note: "Регистрация не нужна, чтобы начать. Без аккаунта данные остаются на этом устройстве.",
      featuresTitle: "У каждой машины — своя история работ",
      featuresLead:
        "Добавляйте ремонты, замены и осмотры по мере их выполнения. В истории останутся дата и пробег — к ним можно вернуться позже.",
      features: [
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
      ],
      howTitle: "Как начать",
      steps: [
        { title: "Добавьте автомобиль", text: "Укажите марку, модель и текущий пробег." },
        { title: "Запишите работы", text: "Добавьте недавние и известные прошлые работы. Можно начать с последней записи." },
        { title: "Добавьте детали", text: "Укажите установленные компоненты и срок службы, если он известен." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
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
      ],
    },
    costs: {
      navTitle: "Учёт расходов",
      title: "Учёт расходов на автомобиль",
      description:
        "Записывайте стоимость ремонтов, запчастей и обслуживания. В отчёте расходы по каждой машине показаны отдельно по валютам.",
      eyebrow: "Расходы на машину",
      lead: "Указывайте стоимость ремонта, замены или покупки вместе с записью о работе. В отчёте можно посмотреть сумму расходов по каждой валюте.",
      cta: "Начать учёт расходов",
      note: "Бесплатно и без регистрации. Без аккаунта записи хранятся на этом устройстве.",
      featuresTitle: "Расходы записаны вместе с работами",
      featuresLead:
        "У каждой суммы есть контекст: что сделали, когда и на каком пробеге.",
      features: [
        {
          title: "Стоимость каждой работы",
          text: "Укажите стоимость замены, ремонта, покупки или осмотра. В записи также можно сохранить дату, пробег и комментарий — например, артикул или название сервиса.",
        },
        {
          title: "Итог по машине",
          text: "Отчёт суммирует записи с указанной стоимостью и показывает, сколько записей вошло в расчёт.",
        },
        {
          title: "Разные валюты",
          text: "Можно выбрать рубли, тенге, гривны, белорусские рубли, доллары или евро. Суммы не пересчитываются по курсу: для каждой валюты показывается свой итог.",
        },
        {
          title: "Повтор без перепечатки",
          text: "При повторной замене той же детали приложение заполнит стоимость из прошлой записи. Если цена изменилась, её можно исправить.",
        },
        {
          title: "Отчёт в PDF",
          text: "Сохраните историю работ в PDF. В отчёте можно показать расходы или скрыть их.",
        },
        {
          title: "Несколько машин",
          text: "Расходы записываются отдельно для каждого автомобиля.",
        },
      ],
      howTitle: "Как вести учёт",
      steps: [
        { title: "Добавьте автомобиль", text: "Укажите марку, модель и текущий пробег." },
        { title: "Записывайте работы", text: "Для ремонта, замены или покупки укажите дату, пробег и стоимость, если хотите её учитывать." },
        { title: "Откройте отчёт", text: "В нём показана сумма записанных расходов отдельно по каждой валюте." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        {
          q: "Можно учитывать расходы на топливо?",
          a: "Нет. В приложении можно записывать стоимость ремонта, замены, покупки и осмотра. Учёта заправок пока нет.",
        },
        {
          q: "Что, если цену работы я не помню?",
          a: "Запись сохранится и без стоимости. Она не попадёт в сумму расходов.",
        },
        {
          q: "Как посчитаются расходы в разных валютах?",
          a: "Отдельно. Например, рубли суммируются с рублями, а евро — с евро. Пересчёта по курсу нет.",
        },
      ],
    },
    parts: {
      navTitle: "Срок замены деталей",
      title: "Срок замены деталей автомобиля по пробегу и времени",
      description:
        "Запишите дату и пробег замены, затем укажите интервал по пробегу или времени. Приложение покажет расчётный остаток срока до следующей замены.",
      eyebrow: "Ресурс деталей",
      lead: "Для каждой замены укажите дату, пробег и интервал службы детали. Приложение рассчитает остаток по пробегу, времени или обоим параметрам.",
      cta: "Открыть гараж",
      note: "Начать можно без регистрации. Интервал замены укажите по сервисной книжке, рекомендации мастера или своему опыту.",
      featuresTitle: "Расчёт по указанным интервалам",
      featuresLead:
        "Приложение не выбирает интервал за вас. Если для расчёта не хватает данных, это будет указано в списке деталей.",
      features: [
        {
          title: "По пробегу и по времени",
          text: "Можно задать интервал по пробегу, по времени или оба. Если указаны оба, статус определяется по тому, какой срок наступит раньше.",
        },
        {
          title: "Что скоро менять",
          text: "При остатке менее 20% появляется статус «Скоро замена». После окончания интервала — «Просрочено» с превышением в километрах или днях. Эти записи видны в списке «Требует внимания».",
        },
        {
          title: "Осмотр важнее расчёта",
          text: "Результат осмотра детали заменяет расчётный статус. Например, если колодки изношены раньше срока, отметьте это в записи осмотра.",
        },
        {
          title: "Жидкости и колёса",
          text: "Для масел и технических жидкостей есть готовые пункты. Для колодок, амортизаторов и шин можно указать ось и сторону установки.",
        },
        {
          title: "Повторная замена",
          text: "При повторной замене срок службы, стоимость и заметка заполняются по прошлой записи. Предыдущая замена остаётся в истории.",
        },
        {
          title: "Обновите пробег — остальное пересчитается",
          text: "Расчёт использует текущий пробег автомобиля. После его обновления остаток по пробегу пересчитывается.",
        },
      ],
      howTitle: "Как начать следить за ресурсом",
      steps: [
        { title: "Добавьте автомобиль", text: "Укажите текущий пробег — он нужен для расчёта по километрам." },
        { title: "Запишите последнюю замену", text: "Укажите дату, пробег и интервал до следующей замены." },
        { title: "Проверяйте статусы", text: "Список «Требует внимания» показывает детали с подходящим сроком замены или просроченным интервалом." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        {
          q: "Carvisio знает интервалы замены для моей машины?",
          a: "Нет. Интервал замены нужно указать самостоятельно — например, по сервисной книжке или рекомендации мастера.",
        },
        {
          q: "Приложение пришлёт уведомление, когда пора менять?",
          a: "Нет. Статусы «Скоро замена» и «Просрочено» отображаются в приложении на карточке автомобиля и в списке деталей.",
        },
        {
          q: "Это измерение износа?",
          a: "Нет. Приложение рассчитывает срок по пробегу и времени с момента замены. Фактическое состояние детали можно указать по результатам осмотра.",
        },
      ],
    },
  } satisfies Record<string, Landing>,
};

export type SeoMessages = typeof ru;

const en: SeoMessages = {
  siteTitle: "carvisio: car service history",
  siteDescription: "Log mileage, repairs and part replacements so your car's service history is always at hand.",
  homeTitle: "carvisio: your garage online, service history and part life",
  homeDescription:
    "Keep the service history of your cars: mileage, replacements and repairs, the remaining life of installed parts and the state of each system. Start without signing up.",
  og: {
    title: "Car maintenance log",
    subtitle: "Mileage, replacements, repairs and part life in one history",
    alt: "carvisio: car service history",
  },
  features: [
    "Service history: replacements, repairs, purchases and inspections",
    "Part service life by mileage and time",
    "Expense tracking per currency",
    "Service history report as PDF",
    "Several cars, with VIN or chassis number",
  ],
  brandAria: "carvisio: to the garage",
  openGarage: "Open garage",
  back: "Back to the garage",
  footer: "carvisio · the work and parts history of your car",
  related: "More about carvisio",
  pages: {
    journal: {
      navTitle: "Maintenance log",
      title: "Online car maintenance log",
      description:
        "Record mileage, replacements and repairs. Carvisio keeps the service history of every car and helps you keep track of part life.",
      eyebrow: "Car maintenance",
      lead: "Log services, repairs and inspections. For each job you can record the date, mileage and cost, and add a comment.",
      cta: "Go to the garage",
      note: "No sign-up needed to start. Without an account, your data stays on this device.",
      featuresTitle: "Every car keeps its own history",
      featuresLead:
        "Add repairs, replacements and inspections as you do them. The date and mileage stay in the history so you can come back to them later.",
      features: [
        {
          title: "Work and costs",
          text: "Add a service, repair or inspection. Each record can carry the date, mileage, cost and a comment.",
        },
        {
          title: "Parts and their life",
          text: "Note which part went in and when. Set its service life and Carvisio works out what's left by mileage or time.",
        },
        {
          title: "Part condition",
          text: "Flag parts that need attention. If no service life is set, the app says there isn't enough data yet.",
        },
      ],
      howTitle: "How to start",
      steps: [
        { title: "Add a car", text: "Enter the make, model and current mileage." },
        { title: "Log the work", text: "Add recent and known past jobs. You can start with the latest one." },
        { title: "Add parts", text: "List the installed components and their service life, if you know it." },
      ],
      faqTitle: "Questions and answers",
      faq: [
        {
          q: "Does Carvisio determine the car's technical condition?",
          a: "No. The app doesn't read data from the car and doesn't replace diagnostics. Part status and remaining life are based on what you've entered.",
        },
        {
          q: "Can I keep several cars?",
          a: "Yes. Each car has its own work history and list of installed parts.",
        },
        {
          q: "Do I need to sign up?",
          a: "No, you can start without an account. Later you can move the garage into an account and open it on other devices.",
        },
      ],
    },
    costs: {
      navTitle: "Expense tracking",
      title: "Car expense tracker online",
      description:
        "Record what repairs, parts and servicing cost. Carvisio keeps the expenses of each car and totals them in the report, separately for each currency.",
      eyebrow: "Car expenses",
      lead: "How much has the car cost you so far? Record the price of every job (replacements, repairs, purchases) and the total is always at hand.",
      cta: "Start tracking expenses",
      note: "Free and no sign-up. Without an account, records stay on this device.",
      featuresTitle: "Costs next to the work, not in a separate spreadsheet",
      featuresLead:
        "The cost is part of the work record: you see not just the amount but what it was for, when, and at what mileage.",
      features: [
        {
          title: "The cost of every job",
          text: "A replacement, repair, purchase or inspection has a cost field. Next to it: date, mileage, part and a comment for the part number, shop or warranty.",
        },
        {
          title: "Totals per car",
          text: "The car's report adds up every recorded cost. If some jobs have no price, the report says how many records the total covers.",
        },
        {
          title: "Several currencies",
          text: "Roubles, tenge, hryvnia, Belarusian roubles, dollars and euros. Amounts in different currencies never mix: each is totalled on its own.",
        },
        {
          title: "Repeat without retyping",
          text: "Next time you replace the same part, the cost is filled in from the previous record. Just adjust the price if it changed.",
        },
        {
          title: "PDF report",
          text: "Save the work history with costs as a PDF: for yourself, the garage, or a buyer when you sell the car. Costs can be hidden in the report.",
        },
        {
          title: "Several cars",
          text: "Each car keeps its own books: one car's costs never mix with another's.",
        },
      ],
      howTitle: "How to track",
      steps: [
        { title: "Add a car", text: "Make, model and mileage are enough to start." },
        { title: "Log work with its cost", text: "Replacement, repair or purchase: enter the date, mileage and what you paid." },
        { title: "See the total in the report", text: "Open the car's report: costs are added up per currency." },
      ],
      faqTitle: "Questions and answers",
      faq: [
        {
          q: "Can I track fuel costs?",
          a: "Not yet. Carvisio records work on the car (replacements, repairs, purchases and inspections) and what it cost. Refuelling isn't tracked separately.",
        },
        {
          q: "What if I don't remember the price?",
          a: "The cost is optional. A record without a price stays in the history but isn't part of the total; it isn't counted as zero.",
        },
        {
          q: "How are costs in different currencies totalled?",
          a: "Separately for each currency. Carvisio doesn't convert amounts, so the total doesn't depend on the day's exchange rate.",
        },
      ],
    },
    parts: {
      navTitle: "Part service life",
      title: "Car part service life: know when the oil and parts are due",
      description:
        "Log oil, brake pad, filter and other part replacements with their service life. Carvisio works out what's left by mileage and time and shows what's due soon.",
      eyebrow: "Part service life",
      lead: "Note when a part went in and how long it should last, by mileage, by time or both. Carvisio shows how much is left and what's coming up for replacement.",
      cta: "Open garage",
      note: "Start without signing up. You set the intervals: from the manual, your mechanic's advice or your own experience.",
      featuresTitle: "Remaining life from your data, not guesses",
      featuresLead:
        "Carvisio doesn't fill in “average” intervals. Life is counted only from what you entered, and where there's no data, it says so.",
      features: [
        {
          title: "By mileage and by time",
          text: "Oil every 10,000 km or once a year, brake fluid every two years. With both set, what's left is whichever runs out first.",
        },
        {
          title: "What's due soon",
          text: "Under 20% of life left, a part is marked “Due soon”, and after that “Overdue” with the overrun in km or days. Such parts are gathered in the “Needs attention” list.",
        },
        {
          title: "Inspection beats the forecast",
          text: "If an inspection found the pads worn early, record it: the part's status then comes from the inspection, not the forecast.",
        },
        {
          title: "Fluids and wheels",
          text: "Engine and transmission oil, coolant and brake fluid come from a ready list. Pads, shock absorbers and tyres can carry an axle and a side.",
        },
        {
          title: "Repeat replacement",
          text: "Next time, service life, cost and note are filled in from the previous record. The old part stays in the history.",
        },
        {
          title: "Update the mileage, the rest recalculates",
          text: "What's left is counted from the car's current mileage. Update it now and then and every forecast recalculates.",
        },
      ],
      howTitle: "How to start tracking part life",
      steps: [
        { title: "Add the car and its mileage", text: "The current mileage is where every forecast starts." },
        { title: "Log the last replacement", text: "For example, oil: date, mileage and a life of 10,000 km or one year." },
        { title: "Watch the statuses", text: "Parts that are due soon show up in the “Needs attention” list." },
      ],
      faqTitle: "Questions and answers",
      faq: [
        {
          q: "Does Carvisio know the service intervals for my car?",
          a: "No, and it doesn't pretend to. You set the intervals, from the service book, your mechanic or experience, so the forecast rests on what you trust.",
        },
        {
          q: "Will the app notify me when something is due?",
          a: "Not yet: “Due soon” and “Overdue” are shown in the app, on the car's card and in its parts list.",
        },
        {
          q: "Is this a wear measurement?",
          a: "No. What's left is a forecast from mileage and time since install. Only an inspection shows real wear, and you can record its result.",
        },
      ],
    },
  },
};

export const seo = { ru, en } satisfies Record<Locale, SeoMessages>;
export type LandingPage = keyof SeoMessages["pages"];
