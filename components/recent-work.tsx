"use client";

import { useState } from "react";
import styles from "@/app/(ru)/car/page.module.css";
import { eventTypeLabel, formatKm, formatMoney } from "@/lib/compute";
import { formatDate, parseDay } from "@/lib/i18n";
import { useT } from "@/lib/i18n/react";
import type { Component, MaintenanceEvent } from "@/lib/types";

const VISIBLE = 5;

type Props = {
  events: MaintenanceEvent[]; // newest first
  components: Component[];
  onOpen: (event: MaintenanceEvent) => void;
};

// The car's maintenance timeline. Shows the latest five until История ships;
// every row opens the record so a typo can be fixed or removed.
export default function RecentWork({ events, components, onOpen }: Props) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  if (events.length === 0) return null;
  const shown = showAll ? events : events.slice(0, VISIBLE);

  return (
    <section aria-labelledby="recent-work-title">
      <div className={styles.sectionHead}>
        <h2 id="recent-work-title" className={styles.sectionTitle}>
          {showAll ? t.car.allWork : t.car.recentWork}
        </h2>
        {events.length > VISIBLE ? (
          <button type="button" className={styles.sectionLink} onClick={() => setShowAll((v) => !v)}>
            {showAll ? t.car.collapse : t.car.showAll(events.length)}
          </button>
        ) : null}
      </div>
      <ul className={styles.eventList}>
        {shown.map((e) => {
          const names = e.componentIds
            .map((id) => components.find((c) => c.id === id)?.name)
            .filter(Boolean)
            .join(", ");
          const date = parseDay(e.date.slice(0, 10));
          return (
            <li key={e.id} className={styles.eventItem}>
              <button type="button" className={styles.eventRow} onClick={() => onOpen(e)}>
                <span className={styles.eventDate}>
                  <span className={styles.eventDateDay}>
                    {formatDate(date, { day: "2-digit", month: "short" })}
                  </span>
                  <span className={styles.eventDateYear}>{date.getFullYear()}</span>
                </span>
                <span className={styles.eventMain}>
                  <span className={styles.eventTitle}>
                    {eventTypeLabel(e.type)}
                    {names ? `: ${names}` : ""}
                  </span>
                  <span className={`${styles.eventMeta} numeric`}>
                    {[
                      e.mileageKm !== undefined ? formatKm(e.mileageKm) : null,
                      e.costMinorUnits !== undefined ? formatMoney(e.costMinorUnits, e.currency) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {e.notes ? <span className={styles.eventNotes}>{e.notes}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
