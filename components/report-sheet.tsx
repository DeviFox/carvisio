"use client";

import { useId } from "react";
import s from "./report-sheet.module.css";
import { useGarage } from "@/lib/store";
import {
  eventTypeLabel,
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
import { formatDate, getLocale, tr } from "@/lib/i18n";
import { useT } from "@/lib/i18n/react";

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
  const t = useT();
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
  // Russian drops the trailing "г." Intl adds after the year.
  const longDate = formatDate(today, { day: "numeric", month: "long", year: "numeric" });
  const issued = getLocale() === "ru" ? longDate.replace(/\s*г\.$/, "") : longDate;

  return (
    <article className={inline ? `${s.sheet} ${s.inline}` : s.sheet} aria-labelledby={`${uid}-title`}>
      <header className={s.masthead}>
        <span className={s.brand}>carvisio</span>
        <span className={s.docKind}>{t.report.docKind}</span>
      </header>

      <div className={s.vehicle}>
        <h2 className={s.carName} id={`${uid}-title`}>{vehicle.name}</h2>
        {meta ? <p className={s.carMeta}>{meta}</p> : null}
        {vehicle.vin ? (
          <p className={s.carMeta}>
            {t.report.vin} <span className="mono">{vehicle.vin}</span>
          </p>
        ) : null}
      </div>

      <dl className={s.summary}>
        <div className={s.fact}>
          <dt>{t.report.mileage}</dt>
          <dd className="numeric">
            {vehicle.currentMileageKm !== undefined ? (
              formatKm(vehicle.currentMileageKm)
            ) : (
              <span className={s.quiet}>{t.report.notSet}</span>
            )}
          </dd>
        </div>
        <div className={s.fact}>
          <dt>{t.report.records}</dt>
          <dd className="numeric">{vehicleEvents.length}</dd>
        </div>
        {showCosts ? (
          <div className={s.fact}>
            <dt>{t.report.costs}</dt>
            <dd className="numeric">
              {totals.length === 0 ? (
                <span className={s.quiet}>{t.report.costsNotSet}</span>
              ) : (
                totals.map((total) => (
                  <span key={total.currency ?? "-"} className={s.total}>
                    {formatMoney(total.minorUnits, total.currency)}
                  </span>
                ))
              )}
              {totals.length > 0 && costed < vehicleEvents.length ? (
                <span className={s.factNote}>
                  {t.report.costedOf(costed, vehicleEvents.length)}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {showStatus ? (
        <section className={s.section} aria-labelledby={`${uid}-status`}>
          <h3 className={s.sectionTitle} id={`${uid}-status`}>{t.report.statusTitle}</h3>
          <p className={s.sectionNote}>
            {t.report.statusNote(issued)}
          </p>
          {groups.length === 0 ? (
            <p className={s.empty}>{t.report.noComponents}</p>
          ) : (
            <table className={s.status}>
              <thead>
                <tr>
                  <th scope="col" className={s.componentName}>{t.report.component}</th>
                  <th scope="col" className={s.statusCell}>{t.report.state}</th>
                  <th scope="col" className={s.detail}>{t.report.remaining}</th>
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
        <h3 className={s.sectionTitle} id={`${uid}-history`}>{t.report.history}</h3>
        {vehicleEvents.length === 0 ? (
          <p className={s.empty}>{t.report.noWork}</p>
        ) : (
          <table className={`${s.log} ${showCosts ? "" : s.noCost}`}>
            <thead>
              <tr>
                <th scope="col" className={s.dateCol}>{t.report.date}</th>
                <th scope="col" className={s.kmCol}>{t.report.mileage}</th>
                <th scope="col">{t.report.work}</th>
                {showCosts ? <th scope="col" className={s.costCol}>{t.report.cost}</th> : null}
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
          <span>{t.report.issued(issued)}</span>
        </p>
        <p className={s.disclaimer}>
          {t.report.disclaimer}
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
    .map((c) => (c.isArchived ? `${componentLabel(c)} (${tr().report.archived})` : componentLabel(c)))
    .join(", ");
  const type = eventTypeLabel(e.type) ?? tr().report.record;
  return names ? `${type}: ${names}` : type;
}

// The estimate column: the forecast from the owner's interval, or — when the
// owner's own inspection set the status — when that inspection was.
function statusDetail(status: ComponentStatus, summary: string | null, inspectedOn?: string): string {
  if (status.reason === "inspected") {
    return inspectedOn ? tr().report.inspectionOn(formatDay(inspectedOn)) : tr().report.inspection;
  }
  if (status.reason === "computed" && summary) return summary;
  return "";
}
