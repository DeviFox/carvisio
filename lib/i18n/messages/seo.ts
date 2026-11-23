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
  homeTitle: "carvisio — ваш гараж онлайн: история обслуживания и ресурс деталей",
  homeDescription:
    "Ведите историю обслуживания своих автомобилей: пробег, замены и ремонты, ресурс установленных деталей и состояние систем. Можно начать без регистрации.",
  og: {
    title: "Журнал обслуживания автомобиля",
    subtitle: "Пробег, замены и ремонты, ресурс деталей — в одной истории",
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
  footer: "carvisio · история работ и деталей вашей машины",
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
      title: "Учёт расходов на автомобиль онлайн",
      description:
        "Записывайте, сколько стоили ремонт, запчасти и обслуживание. Carvisio хранит расходы по каждой машине и считает итог в отчёте — отдельно по каждой валюте.",
      eyebrow: "Расходы на машину",
      lead: "Сколько ушло на машину за всё время? Записывайте стоимость каждой работы — замены, ремонта, покупки — и итог всегда будет под рукой.",
      cta: "Начать учёт расходов",
      note: "Бесплатно и без регистрации. Без аккаунта записи хранятся на этом устройстве.",
      featuresTitle: "Расходы рядом с работами, а не в отдельной таблице",
      featuresLead:
        "Стоимость — часть записи о работе: вы видите не только сумму, но и за что, когда и на каком пробеге она потрачена.",
      features: [
        {
          title: "Стоимость каждой работы",
          text: "У замены, ремонта, покупки или осмотра есть поле стоимости. Рядом — дата, пробег, деталь и комментарий: артикул, сервис, гарантия.",
        },
        {
          title: "Итог по машине",
          text: "В отчёте по автомобилю Carvisio складывает все записанные расходы. Если часть работ без цены, отчёт честно скажет, по скольким записям посчитан итог.",
        },
        {
          title: "Разные валюты",
          text: "Рубли, тенге, гривны, белорусские рубли, доллары и евро. Суммы в разных валютах не смешиваются: итог считается по каждой отдельно.",
        },
        {
          title: "Повтор без перепечатки",
          text: "При следующей замене той же детали стоимость подставится из прошлой записи — останется поправить цену, если она изменилась.",
        },
        {
          title: "Отчёт в PDF",
          text: "Историю работ с расходами можно сохранить в PDF: для себя, для сервиса или для покупателя при продаже машины. Стоимость в отчёте можно скрыть.",
        },
        {
          title: "Несколько машин",
          text: "У каждого автомобиля свой учёт: расходы на одну машину не смешиваются с другой.",
        },
      ],
      howTitle: "Как вести учёт",
      steps: [
        { title: "Добавьте автомобиль", text: "Марка, модель и пробег — этого достаточно, чтобы начать." },
        { title: "Записывайте работы со стоимостью", text: "Замена, ремонт или покупка: укажите дату, пробег и сколько заплатили." },
        { title: "Смотрите итог в отчёте", text: "Откройте отчёт по машине — расходы сложены по валютам." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        {
          q: "Можно учитывать расходы на топливо?",
          a: "Пока нет. Carvisio записывает работы по машине — замены, ремонты, покупки и осмотры — и их стоимость. Заправки отдельно не ведутся.",
        },
        {
          q: "Что, если цену работы я не помню?",
          a: "Стоимость необязательна. Запись без цены сохранится в истории, а в итог расходов не попадёт — нулём она не считается.",
        },
        {
          q: "Как посчитаются расходы в разных валютах?",
          a: "Отдельно для каждой валюты. Carvisio не пересчитывает суммы по курсу, чтобы итог не зависел от даты пересчёта.",
        },
      ],
    },
    parts: {
      navTitle: "Ресурс деталей",
      title: "Ресурс деталей автомобиля: когда пора менять масло и запчасти",
      description:
        "Записывайте замену масла, колодок, фильтров и других деталей с их сроком службы. Carvisio рассчитает остаток по пробегу и времени и покажет, что скоро пора менять.",
      eyebrow: "Ресурс деталей",
      lead: "Укажите, когда поставили деталь и сколько она должна прослужить — по пробегу, по времени или по обоим параметрам. Carvisio покажет, сколько осталось и что подходит к замене.",
      cta: "Открыть гараж",
      note: "Начать можно без регистрации. Интервалы задаёте вы — по регламенту, рекомендации сервиса или своему опыту.",
      featuresTitle: "Остаток ресурса — по вашим данным, без догадок",
      featuresLead:
        "Carvisio не подставляет «средние» интервалы. Ресурс считается только от того, что вы указали, а там, где данных нет, так и написано.",
      features: [
        {
          title: "По пробегу и по времени",
          text: "Масло — каждые 10 000 км или раз в год, тормозная жидкость — раз в два года. Если заданы оба срока, остаток считается по тому, что закончится раньше.",
        },
        {
          title: "Что скоро менять",
          text: "Когда остаётся меньше 20% ресурса, деталь получает статус «Скоро замена», а после — «Просрочено» с перерасходом в км или днях. Такие детали собраны в списке «Требует внимания».",
        },
        {
          title: "Осмотр важнее расчёта",
          text: "Если на осмотре колодки оказались изношены раньше срока, отметьте это — статус детали возьмётся из осмотра, а не из прогноза.",
        },
        {
          title: "Жидкости и колёса",
          text: "Моторное и трансмиссионное масло, антифриз, тормозная жидкость — из готового списка. Для колодок, амортизаторов и шин можно указать ось и сторону.",
        },
        {
          title: "Повторная замена",
          text: "При следующей замене срок службы, стоимость и заметка подставятся из прошлой записи. Прошлая деталь останется в истории.",
        },
        {
          title: "Обновите пробег — остальное пересчитается",
          text: "Остаток считается от текущего пробега машины. Обновляйте его время от времени, и все прогнозы пересчитаются сами.",
        },
      ],
      howTitle: "Как начать следить за ресурсом",
      steps: [
        { title: "Добавьте машину и пробег", text: "Текущий пробег — точка отсчёта для всех прогнозов." },
        { title: "Запишите последнюю замену", text: "Например, масло: дата, пробег и срок службы — 10 000 км или год." },
        { title: "Следите за статусами", text: "Детали, которым скоро нужна замена, появятся в списке «Требует внимания»." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        {
          q: "Carvisio знает интервалы замены для моей машины?",
          a: "Нет, и не притворяется. Интервалы указываете вы — из сервисной книжки, по совету мастера или по опыту. Так прогноз опирается на то, чему вы доверяете.",
        },
        {
          q: "Приложение пришлёт уведомление, когда пора менять?",
          a: "Пока нет: статусы «Скоро замена» и «Просрочено» видны в приложении — на карточке машины и в списке деталей.",
        },
        {
          q: "Это измерение износа?",
          a: "Нет. Остаток — прогноз по пробегу и времени с момента установки. Реальный износ показывает только осмотр, и его результат можно записать.",
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
