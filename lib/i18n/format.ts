import { getLocale, intlTag } from "./core";

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const rulesCache = new Map<string, Intl.PluralRules>();

// The word for n in the live language: plural(3, { one: "деталь", few: "детали",
// many: "деталей", other: "детали" }). Russian needs one/few/many (other is
// for fractions); English needs one/other.
export function plural(n: number, forms: PluralForms): string {
  const tag = intlTag(getLocale());
  let rules = rulesCache.get(tag);
  if (!rules) {
    rules = new Intl.PluralRules(tag);
    rulesCache.set(tag, rules);
  }
  return forms[rules.select(n)] ?? forms.other;
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return n.toLocaleString(intlTag(), opts);
}

// A calendar day stored as "2026-10-12" is read as a local date: new Date()
// would take it as UTC midnight and show the previous day west of Greenwich.
export function parseDay(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? parseDay(date) : date;
  return Number.isNaN(d.getTime()) ? String(date) : d.toLocaleDateString(intlTag(), opts);
}

export function lowerCase(s: string): string {
  return s.toLocaleLowerCase(getLocale());
}

export function upperCase(s: string): string {
  return s.toLocaleUpperCase(getLocale());
}
