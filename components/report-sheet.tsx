"use client";

import { useId } from "react";
import s from "./report-sheet.module.css";
import { useGarage } from "@/lib/store";
import {
  EVENT_TYPE_LABEL,
  bodyTypeLabel,
  componentLabel,
  componentStatus,
  computeResource,
  costTotals,
  findActiveInstalledPart,
  formatDay,
  formatKm,
  formatMoney,
  fuelLabel,
  latestInspectionFor,
  resourceSummary,
  sortComponentsByName,
  sortEventsByDateDesc,
  type ComponentStatus,
} from "@/lib/compute";
import type { Component, MaintenanceEvent, Vehicle } from "@/lib/types";

type Props = {
  vehicle: Vehicle;
  showCosts: boolean;
  showStatus: boolean;
  today: Date;
  /** On-screen preview: no paper frame, colours follow the app theme. */
  inline?: boolean;
};

// The car's maintenance history as a sheet of A4 paper. Rendered twice by
// ReportPanel: once as the on-screen preview, once at the top of <body> for
// printing, so both read the garage the same way.
export default function ReportSheet({ vehicle, showCosts, showStatus, today, inline = false }: Props) {
  const uid = useId();
  const systems = useGarage((st) => st.systems);
  const components = useGarage((st) => st.components);
  const installedParts = useGarage((st) => st.installedParts);
  const inspections = useGarage((st) => st.inspections);
  const events = useGarage((st) => st.events);

  const vehicleEvents = sortEventsByDateDesc(events.filter((e) => e.vehicleId === vehicle.id));
  const byId = new Map(components.map((c) => [c.id, c]));
  const totals = costTotals(vehicleEvents);
  const costed = vehicleEvents.filter((e) => e.costMinorUnits !== undefined).length;

  const groups = systems
    .filter((sys) => sys.vehicleId === vehicle.id && !sys.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((system) => ({
      system,
      rows: sortComponentsByName(
        components.filter((c) => c.systemId === system.id && !c.isArchived),
      ).map((component) => {
        const resource = computeResource(findActiveInstalledPart(component.id, installedParts), vehicle);
        const inspection = latestInspectionFor(component.id, inspections);
        const status = componentStatus(resource, inspection);
        return { component, status, detail: statusDetail(status, resourceSummary(resource), inspection?.date) };
      }),
    }))
    .filter((g) => g.rows.length > 0);

  const meta = [vehicle.year, fuelLabel(vehicle.fuelType), vehicle.engine, bodyTypeLabel(vehicle.bodyType)]
    .filter(Boolean)
    .join(" · ");
  const issued = today
    .toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    .replace(/\s*г\.$/, "");

  return (
    <article className={inline ? `${s.sheet} ${s.inline}` : s.sheet} aria-labelledby={`${uid}-title`}>
      <header className={s.masthead}>
        <span className={s.brand}>carvisio</span>
        <span className={s.docKind}>История обслуживания</span>
      </header>

      <div className={s.vehicle}>
        <h2 className={s.carName} id={`${uid}-title`}>{vehicle.name}</h2>
        {meta ? <p className={s.carMeta}>{meta}</p> : null}
      </div>

      <dl className={s.summary}>
        <div className={s.fact}>
          <dt>Пробег</dt>
          <dd className="numeric">
            {vehicle.currentMileageKm !== undefined ? (
              formatKm(vehicle.currentMileageKm)
            ) : (
              <span className={s.quiet}>Не указан</span>
            )}
          </dd>
        </div>
        <div className={s.fact}>
          <dt>Записей</dt>
          <dd className="numeric">{vehicleEvents.length}</dd>
        </div>
        {showCosts ? (
          <div className={s.fact}>
            <dt>Расходы</dt>
            <dd className="numeric">
              {totals.length === 0 ? (
                <span className={s.quiet}>Не указаны</span>
              ) : (
                totals.map((t) => (
                  <span key={t.currency ?? "-"} className={s.total}>
                    {formatMoney(t.minorUnits, t.currency)}
                  </span>
                ))
              )}
              {totals.length > 0 && costed < vehicleEvents.length ? (
                <span className={s.factNote}>
                  по {costed} из {vehicleEvents.length} записей
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {showStatus ? (
        <section className={s.section} aria-labelledby={`${uid}-status`}>
          <h3 className={s.sectionTitle} id={`${uid}-status`}>Состояние компонентов</h3>
          <p className={s.sectionNote}>
            На {issued}. Остаток — оценка по сроку службы, который задал владелец.
          </p>
          {groups.length === 0 ? (
            <p className={s.empty}>Компоненты пока не добавлены.</p>
          ) : (
            <table className={s.status}>
              <thead>
                <tr>
                  <th scope="col" className={s.componentName}>Компонент</th>
                  <th scope="col" className={s.statusCell}>Состояние</th>
                  <th scope="col" className={s.detail}>Остаток (оценка)</th>
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.system.id}>
                  <tr>
                    <th colSpan={3} scope="colgroup" className={s.systemName}>
                      {g.system.name}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.component.id}>
                      <th scope="row" className={s.componentName}>
                        {componentLabel(r.component)}
                      </th>
                      <td className={s.statusCell}>
                        <span className={`${s.dot} ${s[`dot-${r.status.label}`]}`} aria-hidden="true" />
                        {r.status.text}
                      </td>
                      <td className={`${s.detail} numeric`}>{r.detail || <span className={s.none}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          )}
        </section>
      ) : null}

      <section className={s.section} aria-labelledby={`${uid}-history`}>
        <h3 className={s.sectionTitle} id={`${uid}-history`}>История обслуживания</h3>
        {vehicleEvents.length === 0 ? (
          <p className={s.empty}>Работы пока не записаны.</p>
        ) : (
          <table className={`${s.log} ${showCosts ? "" : s.noCost}`}>
            <thead>
              <tr>
                <th scope="col" className={s.dateCol}>Дата</th>
                <th scope="col" className={s.kmCol}>Пробег</th>
                <th scope="col">Работа</th>
                {showCosts ? <th scope="col" className={s.costCol}>Стоимость</th> : null}
              </tr>
            </thead>
            <tbody>
              {vehicleEvents.map((e) => (
                <tr key={e.id}>
                  <td className={`${s.dateCol} numeric`}>{e.date ? formatDay(e.date) : "—"}</td>
                  <td className={`${s.kmCol} numeric`}>
                    {e.mileageKm !== undefined && Number.isFinite(e.mileageKm) ? formatKm(e.mileageKm) : "—"}
                  </td>
                  <td className={s.workCol}>
                    <span className={s.workTitle}>{eventTitle(e, byId)}</span>
                    {e.notes?.trim() ? <span className={s.notes}>{e.notes.trim()}</span> : null}
                  </td>
                  {showCosts ? (
                    <td className={`${s.costCol} numeric`}>
                      {e.costMinorUnits !== undefined ? formatMoney(e.costMinorUnits, e.currency) : "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className={s.colophon}>
        <p className={s.issued}>
          <span className={s.brand}>carvisio</span>
          <span>Сформировано {issued}</span>
        </p>
        <p className={s.disclaimer}>
          Документ сформирован на основании данных, внесённых владельцем автомобиля. Carvisio не проводит независимую
          проверку истории обслуживания, пробега или технического состояния.
        </p>
      </footer>
    </article>
  );
}

// "Замена: Колодки передние, Диски (архив)". Components removed from tracking
// keep their name here, so old records stay readable.
function eventTitle(e: MaintenanceEvent, byId: Map<string, Component>): string {
  const names = e.componentIds
    .map((cid) => byId.get(cid))
    .filter((c): c is Component => !!c)
    .map((c) => (c.isArchived ? `${componentLabel(c)} (архив)` : componentLabel(c)))
    .join(", ");
  const type = EVENT_TYPE_LABEL[e.type] ?? "Запись";
  return names ? `${type}: ${names}` : type;
}

// The estimate column: the forecast from the owner's interval, or — when the
// owner's own inspection set the status — when that inspection was.
function statusDetail(status: ComponentStatus, summary: string | null, inspectedOn?: string): string {
  if (status.reason === "inspected") return inspectedOn ? `осмотр ${formatDay(inspectedOn)}` : "осмотр";
  if (status.reason === "computed" && summary) return summary;
  return "";
}
