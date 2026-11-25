import { plural } from "../format";

// The garage (home) screen and the chrome around every screen: top bar,
// theme and language toggles, footer, the "how it works" story.
const ru = {
  sections: "Разделы",
  garage: "Гараж",
  toGarage: "В гараж",
  howItWorks: "Как это работает",
  settingsSoon: "Настройки — скоро",
  settingsSoonTitle: "Настройки — в разработке",
  soon: "скоро",
  journalLink: "Как вести журнал обслуживания",
  aboutNav: "О carvisio",
  costsLink: "Расходы на автомобиль",
  partsLink: "Срок замены деталей",

  theme: {
    now: { system: "как в системе", light: "светлая", dark: "тёмная" },
    next: { system: "включить светлую", light: "включить тёмную", dark: "вернуть как в системе" },
    label: (now: string, next: string) => `Тема: ${now}. Нажмите, чтобы ${next}`,
  },
  language: {
    switchTo: "Switch to English",
  },

  title: "Мой гараж",
  addCar: "Добавить автомобиль",
  carsInGarage: "Автомобили в гараже",
  addFirstCar: "Добавить первый автомобиль",
  addAnotherCar: "Добавить ещё автомобиль",
  emptyDesc: "Марка, модель, год, пробег — остальное появится по мере внесения работ.",
  mileageMissing: "Пробег не указан",
  tracking: (n: number) =>
    `Отслеживается ${n} ${plural(n, { one: "деталь", few: "детали", many: "деталей", other: "детали" })}`,
  noLifeSet: "Срок службы деталей не задан",
  addFirstReplacement: "Добавьте первую замену",
  cars: (n: number) => plural(n, { one: "автомобиль", few: "автомобиля", many: "автомобилей", other: "автомобиля" }),
  storedLocally: "Машины хранятся на этом устройстве. Войдите, чтобы получить доступ к гаражу на всех устройствах.",
  refused:
    "Часть изменений не сохранена. Они останутся на этом устройстве, попробуем отправить снова при следующем открытии.",
  offline: "Нет связи с сервером. Изменения сохранены локально и будут синхронизированы, когда связь появится.",
  synced: "Гараж синхронизирован.",
  demo: { oil: "Масло двигателя", note: "5W-30, фильтр заменён вместе" },

  intro: {
    heading: "Как устроен carvisio",
    pageOf: (n: number, total: number) => `${n} из ${total}`,
    announce: (n: number, total: number, title: string) => `Страница ${n} из ${total}: ${title}`,
    example: "пример",
    reopenHint: "Открыть рассказ снова можно значком «?» вверху",
    skip: "Пропустить",
    back: "Назад",
    next: "Далее",
    done: "Понятно",
    systems: {
      title: "Всё о машине — в одном месте",
      body: "Машина разделена на системы: двигатель, тормоза, шины и другие. Выберите нужную в списке или на схеме, чтобы посмотреть компоненты, их состояние и историю обслуживания.",
    },
    replacement: {
      title: "Запишите замену — остальное посчитаем",
      body: "Укажите дату, пробег и срок службы детали — например, 30 000 км или 2 года. carvisio рассчитает остаток и подскажет, когда пора задуматься о замене.",
      part: "Тормозные колодки",
    },
    mileage: {
      title: "Обновляйте пробег, чтобы расчёты были точнее",
      body: "Остаток срока службы рассчитывается от текущего пробега. Обновляйте его время от времени на странице машины — показатели пересчитаются автоматически.",
      current: "Текущий пробег",
      unit: "км",
    },
    repeat: {
      title: "Повторная замена — без лишних действий",
      body: "При следующей замене нажмите «Повторить замену». Стоимость, заметка и срок службы заполнятся по прошлой записи. Останется проверить данные и сохранить.",
    },
  },
};

export type GarageMessages = typeof ru;

const en: GarageMessages = {
  sections: "Sections",
  garage: "Garage",
  toGarage: "To the garage",
  howItWorks: "How it works",
  settingsSoon: "Settings: coming soon",
  settingsSoonTitle: "Settings: in development",
  soon: "soon",
  journalLink: "How to keep a maintenance log",
  aboutNav: "About carvisio",
  costsLink: "Car expense tracking",
  partsLink: "Part service life",

  theme: {
    now: { system: "system", light: "light", dark: "dark" },
    next: { system: "switch to light", light: "switch to dark", dark: "follow the system" },
    label: (now, next) => `Theme: ${now}. Press to ${next}`,
  },
  language: {
    switchTo: "Переключить на русский",
  },

  title: "My garage",
  addCar: "Add a car",
  carsInGarage: "Cars in the garage",
  addFirstCar: "Add your first car",
  addAnotherCar: "Add another car",
  emptyDesc: "Make, model, year, mileage. The rest fills in as you log work.",
  mileageMissing: "Mileage not set",
  tracking: (n) => `Tracking ${n} ${plural(n, { one: "part", other: "parts" })}`,
  noLifeSet: "No service life set for parts",
  addFirstReplacement: "Add the first replacement",
  cars: (n) => plural(n, { one: "car", other: "cars" }),
  storedLocally: "Cars are stored on this device. Sign in to reach your garage from any device.",
  refused: "Some changes weren't saved. They stay on this device; we'll try sending them again next time.",
  offline: "No connection to the server. Changes are saved locally and will sync when you're back online.",
  synced: "Garage is in sync.",
  demo: { oil: "Engine oil", note: "5W-30, filter replaced too" },

  intro: {
    heading: "How carvisio works",
    pageOf: (n, total) => `${n} of ${total}`,
    announce: (n, total, title) => `Page ${n} of ${total}: ${title}`,
    example: "example",
    reopenHint: "Open this again with the “?” icon at the top",
    skip: "Skip",
    back: "Back",
    next: "Next",
    done: "Got it",
    systems: {
      title: "Everything about your car in one place",
      body: "The car is split into systems: engine, brakes, tyres and more. Pick one from the list or on the diagram to see its components, their state and service history.",
    },
    replacement: {
      title: "Log a replacement, we'll do the maths",
      body: "Enter the date, mileage and the part's service life, say 30,000 km or 2 years. carvisio works out what's left and tells you when to start thinking about a replacement.",
      part: "Brake pads",
    },
    mileage: {
      title: "Keep the mileage current for accurate numbers",
      body: "Remaining life is counted from the current mileage. Update it now and then on the car's page and everything recalculates.",
      current: "Current mileage",
      unit: "km",
    },
    repeat: {
      title: "Repeat a replacement in a tap",
      body: "Next time, press “Repeat replacement”. Cost, note and service life are filled in from the previous record. Just check and save.",
    },
  },
};

export const garage = { ru, en };
