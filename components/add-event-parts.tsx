import { RefObject, useState } from "react";
import s from "./dialog.module.css";
import { findActiveInstalledPart, formatDuration, formatKm } from "@/lib/compute";
import { groupInt, groupMoney, groupedChange, intText } from "@/lib/number-input";
import type { Condition, InstalledPart, MaintenanceEvent, MaintenanceType } from "@/lib/types";
import { formatDate, getLocale, tr } from "@/lib/i18n";
import { useT } from "@/lib/i18n/react";

type Field = "component" | "name" | "system" | "date" | "mileage" | "cost" | "lifeKm" | "lifeDays" | "notes";
export type Errors = Partial<Record<Field, string>>;

// Picker order; labels come from common.eventType.
export const TYPES: MaintenanceType[] = [
  "replacement", "purchase", "repair", "inspection", "fluid_service", "observation",
];

export const CONDITIONS: (Condition | "")[] = ["", "good", "worn", "critical"];

export function conditionLabel(c: Condition | ""): string {
  const t = tr();
  if (c === "good") return t.common.status.ok;
  if (c === "worn") return t.common.status.attention;
  if (c === "critical") return t.common.status.critical;
  return t.records.conditionNotSet;
}

export const CURRENCIES = ["RUB", "USD", "EUR", "KZT", "UAH", "BYN"];

export const NEW = "__new";
// Catalog fluid the car doesn't have as a component yet: "__fluid:engine_oil".
export const FLUID = "__fluid:";

export const toNumber = (v: string) => Number(v.replace(/\s/g, "").replace(",", "."));
// Ties a field to its error message for assistive tech: the error span carries `${id}-error`.
export const errorAttrs = (id: string, error?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

export { moneyText as minorToText } from "@/lib/number-input";

// Local calendar date: toISOString() is UTC and gives yesterday after local midnight east of Greenwich.
export const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// The same kind of record for this component on this date: likely a double entry.
export function hasSameDayRecord(
  events: MaintenanceEvent[],
  componentId: string | undefined,
  type: MaintenanceType,
  date: string,
): boolean {
  return (
    !!componentId &&
    events.some((e) => e.type === type && e.date.slice(0, 10) === date && e.componentIds.includes(componentId))
  );
}

// "15 ноября 2025" / "15 November 2025": a local calendar date. Russian drops
// the trailing "г." Intl adds, so it doesn't collide with punctuation.
export function formatLongDate(iso: string): string {
  const day = iso.slice(0, 10);
  if (getLocale() === "ru") return `${formatDate(day, { day: "numeric", month: "long" })} ${day.slice(0, 4)}`;
  return formatDate(day, { day: "numeric", month: "long", year: "numeric" });
}

// Repeat mode: what carries over unchanged, collapsed to one line the owner can reopen.
export function RepeatSummary({ summary, onEdit }: { summary: string; onEdit: () => void }) {
  const t = useT();
  return (
    <div className={s.repeatSummary}>
      <span className={s.repeatText}>{summary}</span>
      <button
        type="button"
        className={s.linkBtn}
        onClick={onEdit}
        aria-label={t.records.editRepeatAria}
      >
        {t.records.edit}
      </button>
    </div>
  );
}

const TIME_UNITS = [
  { value: "d", label: "unitDays", days: 1 },
  { value: "m", label: "unitMonths", days: 30 },
  { value: "y", label: "unitYears", days: 365 },
] as const;
type TimeUnit = (typeof TIME_UNITS)[number]["value"];

function splitDays(days: string): { amount: string; unit: TimeUnit } {
  const n = Number(days);
  if (!days || !(n > 0)) return { amount: "", unit: "m" };
  if (n % 365 === 0) return { amount: String(n / 365), unit: "y" };
  if (n % 30 === 0) return { amount: String(n / 30), unit: "m" };
  return { amount: days, unit: "d" };
}

// Life by time in the unit people think in (months, years); stored as days.
export function DaysInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (days: string) => void;
  invalid?: boolean;
}) {
  const t = useT();
  const [amount, setAmount] = useState(() => splitDays(value).amount);
  const [unit, setUnit] = useState<TimeUnit>(() => splitDays(value).unit);
  const factor = TIME_UNITS.find((u) => u.value === unit)!.days;

  // Follow outside changes (e.g. a component's previous life prefilled),
  // but not our own echo: 2 years typed here comes back as 730 days.
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    const own = amount ? String(Number(amount) * factor) : "";
    if (value !== own) {
      const next = splitDays(value);
      setAmount(next.amount);
      setUnit(next.unit);
    }
  }

  function emit(nextAmount: string, nextUnit: TimeUnit) {
    const f = TIME_UNITS.find((u) => u.value === nextUnit)!.days;
    onChange(nextAmount ? String(Number(nextAmount) * f) : "");
  }

  return (
    <div className={s.unitInput}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${s.input} ${invalid ? s.invalid : ""}`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        value={amount}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d]/g, "");
          setAmount(next);
          emit(next, unit);
        }}
      />
      <select
        className={s.select}
        aria-label={t.records.timeUnit}
        value={unit}
        onChange={(e) => {
          const next = e.target.value as TimeUnit;
          setUnit(next);
          emit(amount, next);
        }}
      >
        {TIME_UNITS.map((u) => (
          <option key={u.value} value={u.value}>{t.records[u.label]}</option>
        ))}
      </select>
    </div>
  );
}

type ResourceProps = {
  tracking: boolean;
  onTrackingChange: (v: boolean) => void;
  lifeKm: string;
  lifeDays: string;
  onLifeKmChange: (v: string) => void;
  onLifeDaysChange: (v: string) => void;
  unit: string;
  errors: Errors;
};

export function ResourceFields({
  tracking,
  onTrackingChange,
  lifeKm,
  lifeDays,
  onLifeKmChange,
  onLifeDaysChange,
  unit,
  errors,
}: ResourceProps) {
  const t = useT();
  return (
    <>
      <div className={s.field}>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={tracking}
            onChange={(e) => onTrackingChange(e.target.checked)}
          />
          {t.records.trackLife}
        </label>
      </div>

      {tracking ? (
        <div className={s.field}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-life-km">{t.records.lifeByMileage}</label>
              <div className={s.suffixInput}>
                <input
                  id="ar-life-km"
                  type="text"
                  inputMode="numeric"
                  className={`${s.input} ${errors.lifeKm ? s.invalid : ""}`}
                  {...errorAttrs("ar-life-km", errors.lifeKm)}
                  value={lifeKm}
                  onChange={groupedChange(groupInt, onLifeKmChange)}
                  autoComplete="off"
                />
                <span className={s.suffix}>{unit}</span>
              </div>
              {errors.lifeKm && <span className={s.error} id="ar-life-km-error">{errors.lifeKm}</span>}
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-life-days">{t.records.lifeByTime}</label>
              <DaysInput
                id="ar-life-days"
                value={lifeDays}
                onChange={onLifeDaysChange}
                invalid={Boolean(errors.lifeDays)}
              />
              {errors.lifeDays && <span className={s.error} id="ar-life-days-error">{errors.lifeDays}</span>}
            </div>
          </div>
          {!lifeKm.trim() && !lifeDays.trim() ? (
            <span className={s.hint}>{t.records.lifeNeedOne}</span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

type CostProps = {
  inputRef?: RefObject<HTMLInputElement | null>;
  cost: string;
  currency: string;
  onCostChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  // The value was copied from a previous record and not touched yet.
  carried?: boolean;
  error?: string;
};

export function CostFields({
  inputRef,
  cost,
  currency,
  onCostChange,
  onCurrencyChange,
  carried,
  error,
}: CostProps) {
  const t = useT();
  return (
    <div className={s.row}>
      <div className={s.field}>
        <label className={s.label} htmlFor="ar-cost">
          {t.records.cost} <span className={s.optional}>{t.common.optional}</span>
        </label>
        <input
          id="ar-cost"
          ref={inputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className={`${s.input} ${error ? s.invalid : ""} ${carried ? s.carried : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "ar-cost-error" : carried ? "ar-cost-carried" : undefined}
          value={cost}
          onChange={groupedChange(groupMoney, onCostChange)}
        />
        {error ? (
          <span className={s.error} id="ar-cost-error">{error}</span>
        ) : carried ? (
          <span className={s.carriedHint} id="ar-cost-carried">{t.records.costCarried}</span>
        ) : null}
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="ar-cur">{t.records.currency}</label>
        <select
          id="ar-cur"
          className={s.select}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

type NotesProps = {
  isNote: boolean;
  value: string;
  onChange: (v: string) => void;
  carried?: boolean;
  error?: string;
};

export function NotesField({ isNote, value, onChange, carried, error }: NotesProps) {
  const t = useT();
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor="ar-notes">
        {isNote ? t.records.noteText : t.records.note}
        {isNote ? null : <span className={s.optional}>{t.common.optional}</span>}
      </label>
      <textarea
        id="ar-notes"
        className={`${s.textarea} ${error ? s.invalid : ""} ${carried ? s.carried : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "ar-notes-error" : carried ? "ar-notes-carried" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isNote ? undefined : t.records.notePlaceholder}
      />
      {error ? (
        <span className={s.error} id="ar-notes-error">{error}</span>
      ) : carried ? (
        <span className={s.carriedHint} id="ar-notes-carried">
          {t.records.noteCarried}
        </span>
      ) : null}
    </div>
  );
}

// The active part's life, as the starting value for its replacement.
export function lifeOf(
  componentId: string | undefined,
  parts: InstalledPart[],
  key: "expectedLifeKm" | "expectedLifeDays",
): string {
  const value = componentId ? findActiveInstalledPart(componentId, parts)?.[key] : undefined;
  if (!value) return "";
  return key === "expectedLifeKm" ? intText(value) : String(value);
}

// Repeat-mode summary of the resource the new part inherits.
export function resourceLine(
  tracking: boolean,
  lifeKm: string,
  lifeDays: string,
): string {
  const t = tr().records;
  if (!tracking) return t.lifeNotTracked;
  const parts = [
    lifeKm.trim() ? formatKm(toNumber(lifeKm)) : null,
    lifeDays.trim() ? formatDuration(toNumber(lifeDays)) : null,
  ].filter(Boolean);
  return parts.length ? t.lifeAsBefore(parts.join(" · ")) : t.lifeNotSet;
}
