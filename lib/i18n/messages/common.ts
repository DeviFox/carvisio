import { plural } from "../format";

// Vocabulary shared across screens: statuses, event types, car attributes,
// units, and the names new cars are seeded with.
const ru = {
  close: "Закрыть",
  cancel: "Отмена",
  save: "Сохранить",
  add: "Добавить",
  delete: "Удалить",
  notSet: "не указан",
  optional: "опционально",
  discardConfirm: "Закрыть без сохранения? Введённое пропадёт.",

  status: {
    ok: "В норме",
    attention: "Требует внимания",
    critical: "Критично",
    noData: "Нет данных",
    lifeNotSet: "Срок не задан",
    overdue: "Просрочено",
    replaceSoon: "Скоро замена",
  },

  eventType: {
    replacement: "Замена",
    purchase: "Покупка",
    inspection: "Осмотр",
    repair: "Ремонт",
    fluid_service: "Долив жидкости",
    observation: "Заметка",
  },

  bodyType: {
    sedan: "Седан",
    hatchback: "Хэтчбек",
    wagon: "Универсал",
    coupe: "Купе",
    crossover: "Кроссовер",
    suv: "Внедорожник",
    pickup: "Пикап",
    minivan: "Минивэн",
    van: "Фургон",
    other: "Другое",
  },
  // Lower-case, as a word inside a line: "универсал · бензин".
  bodyTypeInline: {
    sedan: "седан",
    hatchback: "хэтчбек",
    wagon: "универсал",
    coupe: "купе",
    crossover: "кроссовер",
    suv: "внедорожник",
    pickup: "пикап",
    minivan: "минивэн",
    van: "фургон",
    other: "авто",
  },
  fuel: {
    gasoline: "Бензин",
    diesel: "Дизель",
    hybrid: "Гибрид",
    electric: "Электро",
    lpg: "Газ",
  },
  fuelInline: {
    gasoline: "бензин",
    diesel: "дизель",
    hybrid: "гибрид",
    electric: "электро",
    lpg: "газ",
  },

  axle: { front: "Перед", rear: "Зад" },
  side: { left: "Левый", right: "Правый" },

  // Names a new car's systems and fluids are created with. Once created they
  // are the owner's data and stay as they are when the language changes.
  systemName: {
    engine: "Двигатель",
    cooling: "Охлаждение",
    transmission: "Трансмиссия",
    suspension: "Подвеска",
    brakes: "Тормоза",
    tires: "Шины",
    electrical: "Электрика",
    body: "Кузов",
    other: "Прочее",
  },
  fluidName: {
    engine_oil: "Моторное масло",
    coolant: "Охлаждающая жидкость",
    brake_fluid: "Тормозная жидкость",
    transmission_oil: "Трансмиссионное масло",
    power_steering: "Жидкость ГУР",
    washer: "Омывающая жидкость",
  } as Record<string, string>,

  kmUnit: "км",
  km: (n: string) => `${n} км`,
  days: (n: number) => `${n} дн.`,
  months: (n: number) => `${n} мес.`,
  years: (n: string) => `${n} г.`,
  overLife: (amount: string) => `+${amount} сверх срока`,
  dueNow: "пора менять",
  left: (amount: string) => `ещё ${amount}`,
  today: "сегодня",
  yesterday: "вчера",
  daysAgo: (n: number) => `${n} ${plural(n, { one: "день", few: "дня", many: "дней", other: "дня" })} назад`,
  ago: (duration: string) => `${duration} назад`,

  mileageDigits: "Введите пробег цифрами.",
  mileageDecrease: (current: string) =>
    `Новый пробег меньше текущего (${current}). Пробег не может уменьшаться.`,
};

export type CommonMessages = typeof ru;

const en: CommonMessages = {
  close: "Close",
  cancel: "Cancel",
  save: "Save",
  add: "Add",
  delete: "Delete",
  notSet: "not set",
  optional: "optional",
  discardConfirm: "Close without saving? What you entered will be lost.",

  status: {
    ok: "Good",
    attention: "Needs attention",
    critical: "Critical",
    noData: "No data",
    lifeNotSet: "No interval set",
    overdue: "Overdue",
    replaceSoon: "Due soon",
  },

  eventType: {
    replacement: "Replacement",
    purchase: "Purchase",
    inspection: "Inspection",
    repair: "Repair",
    fluid_service: "Fluid top-up",
    observation: "Note",
  },

  bodyType: {
    sedan: "Sedan",
    hatchback: "Hatchback",
    wagon: "Estate",
    coupe: "Coupe",
    crossover: "Crossover",
    suv: "SUV",
    pickup: "Pickup",
    minivan: "Minivan",
    van: "Van",
    other: "Other",
  },
  bodyTypeInline: {
    sedan: "sedan",
    hatchback: "hatchback",
    wagon: "estate",
    coupe: "coupe",
    crossover: "crossover",
    suv: "SUV",
    pickup: "pickup",
    minivan: "minivan",
    van: "van",
    other: "car",
  },
  fuel: {
    gasoline: "Petrol",
    diesel: "Diesel",
    hybrid: "Hybrid",
    electric: "Electric",
    lpg: "LPG",
  },
  fuelInline: {
    gasoline: "petrol",
    diesel: "diesel",
    hybrid: "hybrid",
    electric: "electric",
    lpg: "LPG",
  },

  axle: { front: "Front", rear: "Rear" },
  side: { left: "Left", right: "Right" },

  systemName: {
    engine: "Engine",
    cooling: "Cooling",
    transmission: "Transmission",
    suspension: "Suspension",
    brakes: "Brakes",
    tires: "Tyres",
    electrical: "Electrics",
    body: "Body",
    other: "Other",
  },
  fluidName: {
    engine_oil: "Engine oil",
    coolant: "Coolant",
    brake_fluid: "Brake fluid",
    transmission_oil: "Transmission oil",
    power_steering: "Power steering fluid",
    washer: "Washer fluid",
  },

  kmUnit: "km",
  km: (n) => `${n} km`,
  days: (n) => `${n} ${plural(n, { one: "day", other: "days" })}`,
  months: (n) => `${n} mo`,
  years: (n) => `${n} yr`,
  overLife: (amount) => `${amount} past due`,
  dueNow: "due now",
  left: (amount) => `${amount} left`,
  today: "today",
  yesterday: "yesterday",
  daysAgo: (n) => `${n} ${plural(n, { one: "day", other: "days" })} ago`,
  ago: (duration) => `${duration} ago`,

  mileageDigits: "Enter the mileage in digits.",
  mileageDecrease: (current) =>
    `The new mileage is lower than the current one (${current}). Mileage can't go down.`,
};

export const common = { ru, en };
