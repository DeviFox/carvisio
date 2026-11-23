import { plural } from "../format";

// The printable service history (PDF report) and its side panel.
const ru = {
  docTitle: (car: string) => `${car} — история обслуживания`,
  title: "Отчёт",
  close: "Закрыть",
  savePdf: "Сохранить PDF",
  contents: "Содержание отчёта",
  optCosts: "Стоимость работ",
  optStatus: "Текущее состояние компонентов",
  hint: "История обслуживания и записи о заменённых компонентах включаются всегда. В окне печати выберите «Сохранить как PDF» и выключите колонтитулы.",

  docKind: "История обслуживания",
  mileage: "Пробег",
  vin: "VIN",
  notSet: "Не указан",
  records: "Записей",
  costs: "Расходы",
  costsNotSet: "Не указаны",
  costedOf: (costed: number, total: number) =>
    `по ${costed} из ${total} ${plural(total, { one: "записи", few: "записей", many: "записей", other: "записи" })}`,
  statusTitle: "Состояние компонентов",
  statusNote: (date: string) => `На ${date}. Остаток — оценка по сроку службы, который задал владелец.`,
  noComponents: "Компоненты пока не добавлены.",
  component: "Компонент",
  state: "Состояние",
  remaining: "Остаток (оценка)",
  history: "История обслуживания",
  noWork: "Работы пока не записаны.",
  date: "Дата",
  work: "Работа",
  cost: "Стоимость",
  issued: (date: string) => `Сформировано ${date}`,
  disclaimer:
    "Документ сформирован на основании данных, внесённых владельцем автомобиля. Carvisio не проводит независимую проверку истории обслуживания, пробега или технического состояния.",
  archived: "архив",
  record: "Запись",
  inspection: "осмотр",
  inspectionOn: (date: string) => `осмотр ${date}`,
};

export type ReportMessages = typeof ru;

const en: ReportMessages = {
  docTitle: (car) => `${car}: service history`,
  title: "Report",
  close: "Close",
  savePdf: "Save PDF",
  contents: "Report contents",
  optCosts: "Cost of work",
  optStatus: "Current component state",
  hint: "Service history and records of replaced components are always included. In the print dialog, choose “Save as PDF” and turn off headers and footers.",

  docKind: "Service history",
  mileage: "Mileage",
  vin: "VIN",
  notSet: "Not set",
  records: "Records",
  costs: "Costs",
  costsNotSet: "Not set",
  costedOf: (costed, total) => `for ${costed} of ${total} ${plural(total, { one: "record", other: "records" })}`,
  statusTitle: "Component state",
  statusNote: (date) => `As of ${date}. Remaining life is an estimate based on the interval the owner set.`,
  noComponents: "No components added yet.",
  component: "Component",
  state: "State",
  remaining: "Remaining (estimate)",
  history: "Service history",
  noWork: "No work recorded yet.",
  date: "Date",
  work: "Work",
  cost: "Cost",
  issued: (date) => `Issued ${date}`,
  disclaimer:
    "This document is based on data entered by the car's owner. Carvisio does not independently verify the service history, mileage or technical condition.",
  archived: "archived",
  record: "Record",
  inspection: "inspection",
  inspectionOn: (date) => `inspection ${date}`,
};

export const report = { ru, en };
