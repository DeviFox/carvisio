"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import styles from "./add-car-dialog.module.css";
import DeleteCar from "./delete-car";
import { ArrowRightIcon, CloseIcon } from "./icons";
import { useGarage } from "@/lib/store";
import { recordGuestVehicle } from "@/lib/guest-vehicles";
import { lockPageScroll } from "@/lib/use-modal";
import { groupInt, groupedChange, intText } from "@/lib/number-input";
import { BODY_TYPES, SEED_SYSTEMS, BodyType, Vehicle } from "@/lib/types";
import { useT } from "@/lib/i18n/react";

// Body types with a redesigned, non-boxy illustration. The rest still render
// via the legacy slab-based builder and are frozen in the picker until they
// get the same treatment.
const READY_BODY_TYPES: ReadonlySet<BodyType> = new Set([
  "sedan", "hatchback", "wagon", "coupe", "crossover",
]);


type DraftErrors = Partial<Record<"make" | "model" | "year" | "mileage" | "vin", string>>;

// Upper-case, no spaces, only what a VIN or body number can contain.
const normalizeVin = (s: string) => s.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (vehicleId: string) => void;
  editVehicle?: Vehicle;
  // Edit mode only: offers "Удалить автомобиль" with an inline confirmation.
  onDelete?: () => void;
};

const CURRENT_YEAR = new Date().getFullYear();

export default function AddCarDialog({ open, onClose, onSaved, editVehicle, onDelete }: Props) {
  const t = useT();
  const addVehicle = useGarage((s) => s.addVehicle);
  const addSystem = useGarage((s) => s.addSystem);
  const updateVehicle = useGarage((s) => s.updateVehicle);
  const isEdit = Boolean(editVehicle);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const [make, setMake] = useState(editVehicle?.make ?? "");
  const [model, setModel] = useState(editVehicle?.model ?? "");
  const [year, setYear] = useState(editVehicle?.year ? String(editVehicle.year) : "");
  const [fuel, setFuel] = useState(editVehicle?.fuelType ?? "");
  const [engine, setEngine] = useState(editVehicle?.engine ?? "");
  const [vin, setVin] = useState(editVehicle?.vin ?? "");
  const [mileage, setMileage] = useState(
    intText(editVehicle?.currentMileageKm),
  );
  const [bodyType, setBodyType] = useState<BodyType | "">(
    editVehicle?.bodyType ?? "",
  );
  const [errors, setErrors] = useState<DraftErrors>({});

  const reset = useCallback(() => {
    setMake("");
    setModel("");
    setYear("");
    setFuel("");
    setEngine("");
    setVin("");
    setMileage("");
    setBodyType("");
    setErrors({});
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  // Sync fields from editVehicle whenever the dialog opens (or is handed
  // another car while open). Done during render, not in an effect, so the
  // first frame of the open dialog already shows the car's values.
  const [synced, setSynced] = useState<{ open: boolean; editVehicle: typeof editVehicle }>(
    { open: false, editVehicle: undefined },
  );
  if (synced.open !== open || (open && synced.editVehicle !== editVehicle)) {
    setSynced({ open, editVehicle });
    if (open) {
      if (editVehicle) {
        setMake(editVehicle.make);
        setModel(editVehicle.model);
        setYear(editVehicle.year ? String(editVehicle.year) : "");
        setFuel(editVehicle.fuelType ?? "");
        setEngine(editVehicle.engine ?? "");
        setVin(editVehicle.vin ?? "");
        setMileage(intText(editVehicle.currentMileageKm));
        setBodyType(editVehicle.bodyType ?? "");
      }
      setErrors({});
    }
  }

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const unlock = lockPageScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open]);

  if (!open) return null;

  function validate(): DraftErrors {
    const next: DraftErrors = {};
    if (!make.trim()) next.make = t.car.err.make;
    if (!model.trim()) next.model = t.car.err.model;
    const y = Number(year);
    if (!year.trim()) {
      next.year = t.car.err.year;
    } else if (!Number.isInteger(y) || y < 1900 || y > CURRENT_YEAR + 1) {
      next.year = t.car.err.yearRange(CURRENT_YEAR + 1);
    }
    const m = Number(mileage.replace(/\s/g, ""));
    // Optional on a new car; once known, it can be corrected but not erased.
    if (!mileage.trim()) {
      if (editVehicle?.currentMileageKm !== undefined) next.mileage = t.car.err.mileage;
    } else if (!Number.isFinite(m) || m < 0 || m > 10_000_000) {
      next.mileage = t.common.mileageDigits;
    }
    if (vin && vin.length < 5) {
      next.vin = t.car.err.vinShort;
    } else if (vin.length === 17 && /[IOQ]/.test(vin)) {
      next.vin = t.car.err.vinLetters;
    }
    return next;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length !== 0) return;

    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    const base = {
      name: `${trimmedMake} ${trimmedModel}`.trim(),
      make: trimmedMake,
      model: trimmedModel,
      year: Number(year),
      fuelType: fuel || undefined,
      engine: engine.trim() || undefined,
      vin: vin || undefined,
      bodyType: (bodyType || undefined) as BodyType | undefined,
      currentMileageKm: mileage.trim() ? Number(mileage.replace(/\s/g, "")) : undefined,
      units: "km" as const,
    };
    let savedId: string;
    if (isEdit && editVehicle) {
      updateVehicle(editVehicle.id, base);
      savedId = editVehicle.id;
    } else {
      const vehicle = addVehicle(base);
      recordGuestVehicle(base);
      // Seed the standard set of systems so every zone on the illustration is
      // interactive out of the box. Owner can archive what they don't track.
      // Named in the interface language; from then on the names are the owner's.
      for (const category of SEED_SYSTEMS) {
        addSystem({ vehicleId: vehicle.id, name: t.common.systemName[category], category });
      }
      savedId = vehicle.id;
    }
    reset();
    onClose();
    onSaved?.(savedId);
  }

  function overlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function dialogKeyDown(e: KeyboardEvent) {
    // basic focus trap on Tab
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={overlayClick}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onKeyDown={dialogKeyDown}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {isEdit ? t.car.carSettings : t.car.addCar}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label={t.common.close}
          >
            <CloseIcon />
          </button>
        </div>

        {isEdit ? null : (
          <div className={styles.stepper} aria-label={t.car.wizardSteps}>
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepDot}>1</span>
              <span className={styles.stepLabel}>
                {t.car.stepBasics}
                <span className={styles.mobileCounter}>{t.car.stepCounter}</span>
              </span>
            </div>
            <div className={styles.stepRule} aria-hidden="true" />
            <div className={styles.step}>
              <span className={styles.stepDot}>2</span>
              <span className={styles.stepLabel}>{t.car.stepMore}</span>
            </div>
          </div>
        )}


        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-make">
                {t.car.make}
              </label>
              <input
                id="f-make"
                ref={firstFieldRef}
                className={`${styles.input} ${errors.make ? styles.invalid : ""}`}
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
                autoComplete="off"
                aria-invalid={!!errors.make}
                aria-describedby={errors.make ? "e-make" : undefined}
                required
              />
              {errors.make && (
                <span className={styles.error} id="e-make">
                  {errors.make}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-model">
                {t.car.model}
              </label>
              <input
                id="f-model"
                className={`${styles.input} ${errors.model ? styles.invalid : ""}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla"
                autoComplete="off"
                aria-invalid={!!errors.model}
                aria-describedby={errors.model ? "e-model" : undefined}
                required
              />
              {errors.model && (
                <span className={styles.error} id="e-model">
                  {errors.model}
                </span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-year">
                {t.car.year}
              </label>
              <input
                id="f-year"
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${errors.year ? styles.invalid : ""}`}
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="2009"
                autoComplete="off"
                aria-invalid={!!errors.year}
                aria-describedby={errors.year ? "e-year" : undefined}
                required
              />
              {errors.year && (
                <span className={styles.error} id="e-year">
                  {errors.year}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-fuel">
                {t.car.fuel}
              </label>
              <select
                id="f-fuel"
                className={styles.select}
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
              >
                <option value="">{t.common.notSet}</option>
                {(Object.entries(t.common.fuel) as Array<[string, string]>).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label} htmlFor="f-body">
              {t.car.bodyType}
              <span className={styles.optional}>{t.car.bodyTypeHint}</span>
            </label>
            <select
              id="f-body"
              className={styles.select}
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value as BodyType | "")}
            >
              <option value="">{t.common.notSet}</option>
              {BODY_TYPES.map((k) => {
                const v = t.common.bodyType[k];
                const ready = READY_BODY_TYPES.has(k);
                return (
                  <option key={k} value={k} disabled={!ready}>
                    {ready ? v : `${v} (${t.car.inDev})`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label} htmlFor="f-engine">
              {t.car.engine}
              <span className={styles.optional}>{t.common.optional}</span>
            </label>
            <input
              id="f-engine"
              className={styles.input}
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder={t.car.enginePlaceholder}
              autoComplete="off"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-mileage">
                {t.car.mileage}
              </label>
              <input
                id="f-mileage"
                type="text"
                inputMode="numeric"
                className={`${styles.input} ${errors.mileage ? styles.invalid : ""} numeric mono`}
                value={mileage}
                onChange={groupedChange(groupInt, setMileage)}
                placeholder="178 430"
                autoComplete="off"
                aria-invalid={!!errors.mileage}
                aria-describedby={errors.mileage ? "e-mileage" : "h-mileage"}
              />
              {errors.mileage ? (
                <span className={styles.error} id="e-mileage">
                  {errors.mileage}
                </span>
              ) : (
                <span className={styles.hint} id="h-mileage">
                  {t.car.mileageHint}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="f-vin">
                {t.car.vin}
                <span className={styles.optional}>{t.common.optional}</span>
              </label>
              <input
                id="f-vin"
                className={`${styles.input} ${errors.vin ? styles.invalid : ""} mono`}
                value={vin}
                onChange={(e) => {
                  setVin(normalizeVin(e.target.value));
                  if (errors.vin) setErrors((x) => ({ ...x, vin: undefined }));
                }}
                placeholder="JTDBT923X71234567"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                aria-invalid={!!errors.vin}
                aria-describedby={errors.vin ? "e-vin" : "h-vin"}
              />
              {errors.vin ? (
                <span className={styles.error} id="e-vin">
                  {errors.vin}
                </span>
              ) : (
                <span className={styles.hint} id="h-vin">
                  {t.car.vinHint}
                </span>
              )}
            </div>
          </div>

          {editVehicle && onDelete ? <DeleteCar vehicle={editVehicle} onDelete={onDelete} /> : null}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={close}
            >
              {t.common.cancel}
            </button>
            <button type="submit" className={styles.primary}>
              {isEdit ? t.common.save : t.common.add}
              <ArrowRightIcon />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
