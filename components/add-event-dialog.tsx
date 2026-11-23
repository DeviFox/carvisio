"use client";

import { FormEvent, useId, useMemo, useRef, useState } from "react";
import s from "./dialog.module.css";
import { CloseIcon } from "./icons";
import { useConfirmClose, useModal } from "@/lib/use-modal";
import { useGarage } from "@/lib/store";
import { eventTypeLabel, componentLabel, findActiveInstalledPart, findComponentByName, formatKm } from "@/lib/compute";
import { sortComponentsByName, systemForCategory, type ComponentPosition } from "@/lib/compute";
import { groupInt, groupedChange, intText } from "@/lib/number-input";
import { FLUIDS, POSITIONED_CATEGORIES } from "@/lib/types";
import { PositionPicker } from "./position-picker";
import { tr } from "@/lib/i18n";
import { useT } from "@/lib/i18n/react";
import type { Condition, InstalledPart, MaintenanceEvent, MaintenanceType, Vehicle } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  defaultSystemId?: string; // open with a new component in this system
  defaultComponentId?: string; // open for this existing component, e.g. from its panel
  defaultType?: MaintenanceType;
  // Previous record to copy cost, currency and notes from; date and mileage stay today's.
  template?: MaintenanceEvent;
  // A recorded event whose type or component is being changed: every field
  // starts from it, and saving puts the new record in its place.
  replacing?: MaintenanceEvent;
};

import {
  CONDITIONS,
  conditionLabel,
  CostFields,
  type Errors,
  FLUID,
  NEW,
  NotesField,
  ResourceFields,
  TYPES,
  RepeatSummary,
  errorAttrs,
  formatLongDate,
  hasSameDayRecord,
  lifeOf,
  minorToText,
  resourceLine,
  toNumber,
  today,
} from "./add-event-parts";
import { deleteEffect, installsPart } from "@/lib/records";

export default function AddEventDialog({
  open,
  onClose,
  vehicle,
  defaultSystemId,
  defaultComponentId,
  defaultType = "replacement",
  template,
  replacing,
}: Props) {
  const titleId = useId();
  const t = useT();
  const dialogRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const systems = useGarage((st) => st.systems);
  const components = useGarage((st) => st.components);
  const installedParts = useGarage((st) => st.installedParts);
  const allEvents = useGarage((st) => st.events);
  const inspections = useGarage((st) => st.inspections);
  // The record being replaced doesn't count against itself ("уже есть").
  const events = useMemo(
    () => (replacing ? allEvents.filter((e) => e.id !== replacing.id) : allEvents),
    [allEvents, replacing],
  );
  const addRecord = useGarage((st) => st.addRecord);
  const deleteEvent = useGarage((st) => st.deleteEvent);
  const startComponentId = replacing?.componentIds[0] ?? defaultComponentId;

  const vehicleSystems = useMemo(
    () => systems.filter((x) => x.vehicleId === vehicle.id && !x.isArchived).sort((a, b) => a.sortOrder - b.sortOrder),
    [systems, vehicle.id],
  );
  const vehicleComponents = useMemo(
    () => components.filter((c) => c.vehicleId === vehicle.id && !c.isArchived),
    [components, vehicle.id],
  );

  const [type, setType] = useState<MaintenanceType>(replacing?.type ?? defaultType);
  const [pick, setPick] = useState(
    startComponentId ?? (defaultSystemId || vehicleComponents.length === 0 ? NEW : ""),
  );
  const [name, setName] = useState("");
  const [systemId, setSystemId] = useState(defaultSystemId ?? vehicleSystems[0]?.id ?? "");
  const [position, setPosition] = useState<ComponentPosition>({});
  const [date, setDate] = useState(replacing ? replacing.date.slice(0, 10) : today());
  const [mileage, setMileage] = useState(intText(replacing ? replacing.mileageKm : vehicle.currentMileageKm));
  const templateCost = minorToText(template?.costMinorUnits);
  const templateNotes = template?.notes ?? "";
  const [cost, setCost] = useState(replacing ? minorToText(replacing.costMinorUnits) : templateCost);
  const [currency, setCurrency] = useState((replacing ?? template)?.currency ?? "RUB");
  const [track, setTrack] = useState<boolean | null>(null);
  const [lifeKm, setLifeKm] = useState(() => lifeOf(startComponentId, installedParts, "expectedLifeKm"));
  const [lifeDays, setLifeDays] = useState(() => lifeOf(startComponentId, installedParts, "expectedLifeDays"));
  // An inspection being replaced keeps its verdict, found the way deleteEvent finds it.
  const [condition, setCondition] = useState<Condition | "">(() => {
    if (replacing?.type !== "inspection") return "";
    const found = inspections.find(
      (i) =>
        replacing.componentIds.includes(i.componentId) &&
        i.date === replacing.date &&
        i.mileageKm === replacing.mileageKm,
    );
    return found?.condition ?? "";
  });
  const [notes, setNotes] = useState(replacing ? (replacing.notes ?? "") : templateNotes);
  // Repeat mode hides the settled fields (type, component, resource) until asked.
  const [expanded, setExpanded] = useState(!template);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestClose = useConfirmClose(
    [type, pick, name, systemId, position, date, mileage, cost, currency, track, lifeKm, lifeDays, condition, notes],
    onClose,
  );
  // Repeating a job, the price is the one thing to judge, so focus starts there.
  const { overlayClick, trapTab, stacked } = useModal(open, requestClose, template ? costRef : typeRef);

  if (!open) return null;

  const unit = t.common.kmUnit;
  const isNote = type === "observation";
  const isFluid = type === "fluid_service";
  const installs = installsPart(type);
  const isNew = !isNote && !isFluid && pick === NEW;
  const fluidComponent = (key: string) => vehicleComponents.find((c) => c.fluid === key);
  // Fluids come only from the catalog: they are topped up, replaced or inspected, never repaired or bought.
  const noFluids = type === "repair" || type === "purchase";
  const choices = vehicleComponents.filter((c) => (isFluid ? !!c.fluid : noFluids ? !c.fluid : true));
  const missingFluids = isNote || noFluids ? [] : FLUIDS.filter((f) => !fluidComponent(f.key));
  const pickedFluid = missingFluids.find((f) => FLUID + f.key === pick);
  const fluidSystem = pickedFluid ? systemForCategory(vehicleSystems, pickedFluid.category) : undefined;
  const selected = isNew ? undefined : choices.find((c) => c.id === pick);
  const pickValue = selected ? selected.id : isNew || pickedFluid ? pick : "";
  const prevPart = selected ? findActiveInstalledPart(selected.id, installedParts) : undefined;
  // Track by default for anything with a resource; inspectables only if a resource was set before.
  const trackAuto = selected
    ? selected.kind !== "inspectable" || !!prevPart?.expectedLifeKm || !!prevPart?.expectedLifeDays
    : true;
  // A purchase is often a one-off (a spare wheel), so its life is opt-in.
  const tracking = installs && (track ?? (type === "replacement" && trackAuto));
  const newSystem = vehicleSystems.find((x) => x.id === systemId);
  const positioned = isNew && !!newSystem && POSITIONED_CATEGORIES.includes(newSystem.category);
  const newPosition = positioned ? position : {};
  const duplicate = isNew ? findComponentByName(vehicleComponents, name, undefined, newPosition) : undefined;
  // The template only speaks for the same job on the same component.
  const repeat = !!template && type === "replacement" && !!selected && selected.id === defaultComponentId;
  const compact = repeat && !expanded;
  const costCarried = repeat && templateCost !== "" && cost === templateCost;
  const notesCarried = repeat && templateNotes.trim() !== "" && notes === templateNotes;

  const groups = vehicleSystems
    .map((sys) => ({ sys, items: sortComponentsByName(choices.filter((c) => c.systemId === sys.id)) }))
    .filter((g) => g.items.length > 0);

  // Leaving the templated job: values copied from it no longer apply.
  function leaveTemplate() {
    if (!template) return;
    if (cost === templateCost) setCost("");
    if (notes === templateNotes) setNotes("");
  }

  function chooseType(value: MaintenanceType) {
    setType(value);
    if (value !== "replacement") leaveTemplate();
  }

  function chooseComponent(value: string) {
    if (value !== defaultComponentId) leaveTemplate();
    setPick(value);
    setTrack(null);
    setErrors((e) => ({ ...e, component: undefined, name: undefined }));
    // A previous part's resource is the only grounded default for the new one.
    const prev = value && value !== NEW ? findActiveInstalledPart(value, installedParts) : undefined;
    setLifeKm(prev?.expectedLifeKm ? intText(prev.expectedLifeKm) : "");
    setLifeDays(prev?.expectedLifeDays ? String(prev.expectedLifeDays) : "");
  }

  function validate(): Errors {
    const e: Errors = {};
    if (isNew) {
      if (!name.trim()) e.name = t.records.err.name;
      else if (findComponentByName(vehicleComponents, name, systemId, newPosition)) {
        e.name = t.records.err.duplicateComponent;
      }
      if (!systemId) e.system = t.records.err.system;
    } else if (pickedFluid && !fluidSystem) {
      e.component = t.records.err.noSystems;
    } else if (!isNote && !selected && !pickedFluid) {
      e.component = isFluid ? t.records.err.fluid : t.records.err.component;
    }
    if (!date) e.date = t.records.err.date;
    else if (date > today()) e.date = t.records.err.dateFuture;
    if (mileage.trim()) {
      const n = toNumber(mileage);
      if (!Number.isFinite(n) || n < 0) {
        e.mileage = t.common.mileageDigits;
      } else if (vehicle.currentMileageKm !== undefined && n > vehicle.currentMileageKm) {
        e.mileage = t.records.err.mileageAboveUpdate(formatKm(vehicle.currentMileageKm));
      }
    } else if (!isNote) {
      e.mileage = t.records.err.mileage;
    }
    if (cost.trim()) {
      const n = toNumber(cost);
      if (!Number.isFinite(n) || n < 0) e.cost = t.records.err.costNegative;
    }
    if (tracking && lifeKm.trim()) {
      const n = toNumber(lifeKm);
      if (!Number.isFinite(n) || n <= 0) e.lifeKm = t.records.err.lifePositive;
    }
    if (tracking && lifeDays.trim() && !(toNumber(lifeDays) > 0)) {
      e.lifeDays = t.records.err.lifePositive;
    }
    if (isNote && !notes.trim()) e.notes = t.records.err.noteText;
    return e;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length !== 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    const costMinor = cost.trim() ? Math.round(toNumber(cost) * 100) : undefined;
    // Replacing: the old record goes first (undoing what it did to the parts),
    // then the new one is added. If the new one is refused, the garage is put
    // back exactly as it was, so a failed save never loses the old record.
    const before = replacing ? useGarage.getState() : undefined;
    if (replacing) deleteEvent(replacing.id);
    const result = addRecord({
      vehicleId: vehicle.id,
      type,
      date,
      mileageKm: mileage.trim() ? toNumber(mileage) : undefined,
      componentId: selected?.id,
      newComponent: isNew
        ? { name: name.trim(), systemId, ...newPosition }
        : pickedFluid && fluidSystem
          ? { name: t.common.fluidName[pickedFluid.key], systemId: fluidSystem.id, fluid: pickedFluid.key }
          : undefined,
      costMinorUnits: costMinor,
      currency: costMinor !== undefined ? currency : undefined,
      notes,
      resource: tracking
        ? {
            expectedLifeKm: lifeKm.trim() ? toNumber(lifeKm) : undefined,
            expectedLifeDays: lifeDays.trim() ? toNumber(lifeDays) : undefined,
          }
        : undefined,
      condition: type === "inspection" && condition ? condition : undefined,
    });
    if (!result.ok) {
      if (before) {
        const { vehicles, systems, components, installedParts, events, mileageHistory, inspections, reminders } = before;
        useGarage.setState({ vehicles, systems, components, installedParts, events, mileageHistory, inspections, reminders });
      }
      setFormError(result.error);
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }
    onClose();
  }

  return (
    <div className={`${s.overlay} ${stacked ? s.stacked : ""}`} onClick={overlayClick} role="presentation">
      <div
        ref={dialogRef}
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-sub`}
        onKeyDown={(e) => trapTab(e, dialogRef.current)}
      >
        <div className={s.header}>
          <div className={s.titleGroup}>
            <h2 className={s.title} id={titleId}>
              {replacing
                ? t.records.editTitle
                : repeat && selected
                  ? t.records.repeatTitle(componentLabel(selected))
                  : t.records.addTitle}
            </h2>
            <p className={s.subtitle} id={`${titleId}-sub`}>
              {replacing
                ? replacedLine(replacing, installs, installedParts)
                : repeat && template
                  ? t.records.repeatSubtitle(formatLongDate(template.date))
                  : t.records.addSubtitle}
            </p>
          </div>
          <button type="button" className={s.close} onClick={requestClose} aria-label={t.common.close}>
            <CloseIcon />
          </button>
        </div>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          {compact ? (
            <RepeatSummary summary={resourceLine(tracking, lifeKm, lifeDays)} onEdit={() => setExpanded(true)} />
          ) : (
            <>
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-type">{t.records.whatWasDone}</label>
              <select
                id="ar-type"
                ref={typeRef}
                className={s.select}
                value={type}
                onChange={(e) => chooseType(e.target.value as MaintenanceType)}
              >
                {TYPES.map((v) => (
                  <option key={v} value={v}>{t.common.eventType[v]}</option>
                ))}
              </select>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="ar-component">
                {t.records.componentQuestion[type]}
                {isNote ? <span className={s.optional}>{t.common.optional}</span> : null}
              </label>
              <select
                id="ar-component"
                className={`${s.select} ${errors.component ? s.invalid : ""}`}
                {...errorAttrs("ar-component", errors.component)}
                value={pickValue}
                onChange={(e) => chooseComponent(e.target.value)}
              >
                <option value="">
                  {isNote ? t.records.noComponent : isFluid ? t.records.chooseFluid : t.records.chooseComponent}
                </option>
                {isFluid
                  ? FLUIDS.map((f) => {
                      const c = fluidComponent(f.key);
                      return c ? (
                        <option key={c.id} value={c.id}>{componentLabel(c)}</option>
                      ) : (
                        <option key={f.key} value={FLUID + f.key}>{t.common.fluidName[f.key]}</option>
                      );
                    })
                  : groups.map((g) => (
                      <optgroup key={g.sys.id} label={g.sys.name}>
                        {g.items.map((c) => (
                          <option key={c.id} value={c.id}>{componentLabel(c)}</option>
                        ))}
                      </optgroup>
                    ))}
                {!isFluid && missingFluids.length > 0 ? (
                  <optgroup label={t.records.fluids}>
                    {missingFluids.map((f) => (
                      <option key={f.key} value={FLUID + f.key}>{t.common.fluidName[f.key]}</option>
                    ))}
                  </optgroup>
                ) : null}
                {!isNote && !isFluid && vehicleSystems.length > 0 ? (
                  <option value={NEW}>{t.records.newComponent}</option>
                ) : null}
              </select>
              {errors.component && <span className={s.error} id="ar-component-error">{errors.component}</span>}
            </div>
            </>
          )}

          {isNew ? (
            <div className={s.row}>
              <div className={s.field}>
                <label className={s.label} htmlFor="ar-name">{t.records.name}</label>
                <input
                  id="ar-name"
                  className={`${s.input} ${errors.name ? s.invalid : ""}`}
                  {...errorAttrs("ar-name", errors.name)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.records.namePlaceholder}
                  autoComplete="off"
                />
                {errors.name && <span className={s.error} id="ar-name-error">{errors.name}</span>}
                {duplicate ? (
                  <span className={s.hint}>
                    {t.records.alreadyExists}
                    {duplicate.systemId !== systemId
                      ? t.records.alreadyExistsIn(vehicleSystems.find((x) => x.id === duplicate.systemId)?.name ?? "")
                      : ""}
                    .{" "}
                    <button
                      type="button"
                      className={s.linkBtn}
                      onClick={() => chooseComponent(duplicate.id)}
                    >
                      {t.records.pickIt}
                    </button>
                  </span>
                ) : null}
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="ar-system">{t.records.vehicleSystem}</label>
                <select
                  id="ar-system"
                  className={`${s.select} ${errors.system ? s.invalid : ""}`}
                  {...errorAttrs("ar-system", errors.system)}
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                >
                  {vehicleSystems.map((sys) => (
                    <option key={sys.id} value={sys.id}>{sys.name}</option>
                  ))}
                </select>
                {errors.system && <span className={s.error} id="ar-system-error">{errors.system}</span>}
              </div>
            </div>
          ) : null}
          {positioned ? <PositionPicker value={position} onChange={setPosition} /> : null}

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-date">{t.records.date}</label>
              <input
                id="ar-date"
                type="date"
                className={`${s.input} ${errors.date ? s.invalid : ""}`}
                {...errorAttrs("ar-date", errors.date)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today()}
              />
              {errors.date ? (
                <span className={s.error} id="ar-date-error">{errors.date}</span>
              ) : !isNote && hasSameDayRecord(events, selected?.id, type, date) ? (
                <span className={s.warning}>{t.records.sameDayRecord}</span>
              ) : null}
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-mileage">
                {t.records.mileage}
                {isNote ? <span className={s.optional}>{t.common.optional}</span> : null}
              </label>
              <div className={s.suffixInput}>
                <input
                  id="ar-mileage"
                  type="text"
                  inputMode="numeric"
                  className={`${s.input} ${errors.mileage ? s.invalid : ""}`}
                  {...errorAttrs("ar-mileage", errors.mileage)}
                  value={mileage}
                  onChange={groupedChange(groupInt, setMileage)}
                  autoComplete="off"
                />
                <span className={s.suffix}>{unit}</span>
              </div>
              {errors.mileage && <span className={s.error} id="ar-mileage-error">{errors.mileage}</span>}
            </div>
          </div>

          {type === "inspection" ? (
            <div className={s.field}>
              <label className={s.label} htmlFor="ar-condition">
                {t.records.result} <span className={s.optional}>{t.common.optional}</span>
              </label>
              <select
                id="ar-condition"
                className={s.select}
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition | "")}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{conditionLabel(c)}</option>
                ))}
              </select>
            </div>
          ) : null}

          <CostFields
            inputRef={costRef}
            cost={cost}
            currency={currency}
            onCostChange={setCost}
            onCurrencyChange={setCurrency}
            carried={costCarried}
            error={errors.cost}
          />

          {installs && !compact ? (
            <ResourceFields
              tracking={tracking}
              onTrackingChange={setTrack}
              lifeKm={lifeKm}
              lifeDays={lifeDays}
              onLifeKmChange={setLifeKm}
              onLifeDaysChange={setLifeDays}
              unit={unit}
              errors={errors}
            />
          ) : null}

          <NotesField
            isNote={isNote}
            value={notes}
            onChange={setNotes}
            carried={notesCarried}
            error={errors.notes}
          />

          {formError && <span className={s.error} role="alert">{formError}</span>}

          <div className={s.footer}>
            <button type="button" className={s.ghostBtn} onClick={requestClose}>
              {t.common.cancel}
            </button>
            <button type="submit" className={s.primary} disabled={submitting}>
              {t.records.submit[type]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// What saving does to the record being changed. When the new record no longer
// installs a part, the old one's effect on the parts is spelled out, as on delete.
function replacedLine(event: MaintenanceEvent, installs: boolean, parts: InstalledPart[]): string {
  const base = tr().records.replacedLine(eventTypeLabel(event.type), formatLongDate(event.date));
  const effect = installs ? null : deleteEffect(event, parts);
  return effect ? `${base} ${effect}` : base;
}
