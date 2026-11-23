"use client";

import { useState } from "react";
import s from "./car-ledger.module.css";
import StatusPill from "./status-pill";
import { PositionBadge } from "./position-picker";
import { resourceSummary } from "@/lib/compute";
import type { ComponentRow } from "./system-list";
import { useT } from "@/lib/i18n/react";

const VISIBLE = 5;

type Props = {
  rows: ComponentRow[];
  onSelect: (row: ComponentRow) => void;
};

// Names what the old banner only counted: the parts due or overdue, worst first.
export default function AttentionList({ rows, onSelect }: Props) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rows : rows.slice(0, VISIBLE);

  return (
    <section className={s.attention} aria-labelledby="attention-title">
      <h2 id="attention-title" className={s.attentionTitle}>
        {t.car.needsAttention}
        <span className={`${s.attentionCount} mono numeric`}>{rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className={s.attentionEmpty}>{t.car.allGood}</p>
      ) : (
        <ul className={s.attentionList}>
          {shown.map((row) => {
            const summary = resourceSummary(row.resource);
            return (
              <li key={row.component.id}>
                <button type="button" className={s.attentionItem} onClick={() => onSelect(row)}>
                  <span className={s.attentionMain}>
                    <span className={s.attentionName}>
                      {row.component.name}
                      <PositionBadge value={row.component} />
                    </span>
                    <span className={s.attentionMeta}>
                      {row.system.name}
                      {summary ? (
                        <>
                          {" · "}
                          <span className="numeric">{summary}</span>
                        </>
                      ) : null}
                    </span>
                  </span>
                  <StatusPill label={row.status.label} text={row.status.text} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > VISIBLE ? (
        <button type="button" className={s.addLink} onClick={() => setShowAll((v) => !v)}>
          {showAll ? t.car.collapse : t.car.showMore(rows.length - VISIBLE)}
        </button>
      ) : null}
    </section>
  );
}
