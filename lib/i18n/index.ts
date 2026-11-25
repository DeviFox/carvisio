import { getLocale, type Locale } from "./core";
import { auth } from "./messages/auth";
import { car } from "./messages/car";
import { common } from "./messages/common";
import { feedback } from "./messages/feedback";
import { garage } from "./messages/garage";
import { records } from "./messages/records";
import { report } from "./messages/report";

export * from "./core";
export * from "./format";

// Each area's file holds ru and en side by side; en is typed against ru, so a
// missing or extra key fails the typecheck instead of showing up blank.
const dictionaries = {
  ru: { common: common.ru, records: records.ru, garage: garage.ru, car: car.ru, auth: auth.ru, report: report.ru, feedback: feedback.ru },
  en: { common: common.en, records: records.en, garage: garage.en, car: car.en, auth: auth.en, report: report.en, feedback: feedback.en },
} satisfies Record<Locale, unknown>;

export type Messages = (typeof dictionaries)["ru"];

export function messagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

// Messages in the live language, for code outside React render (lib/ helpers,
// event handlers). Components use useT() so they re-render on a switch.
export function tr(): Messages {
  return dictionaries[getLocale()];
}
