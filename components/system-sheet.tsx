"use client";

import { useId, useRef } from "react";
import s from "./system-sheet.module.css";
import d from "./dialog.module.css";
import l from "./car-ledger.module.css";
import StatusPill from "./status-pill";
import { CloseIcon, PlusIcon } from "./icons";
import { ComponentLine, countLine, systemIcon, systemStatusText, type SystemGroup } from "./system-list";
import { useModal } from "@/lib/use-modal";
import { useT } from "@/lib/i18n/react";

type Props = {
  group: SystemGroup;
  onClose: () => void;
  onOpenComponent: (componentId: string) => void;
  onAddComponent?: (systemId: string) => void;
};

// Phones and touch screens: a tap on the car opens the system here, in a
// low bottom sheet, instead of scrolling the page away to the ledger. The car
// stays above it with the zone lit, so what was tapped and what opened are on
// screen together. Its parts open the component sheet on top, as in the ledger.
export default function SystemSheet({ group, onClose, onOpenComponent, onAddComponent }: Props) {
  const t = useT();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { overlayClick, trapTab } = useModal(true, onClose, panelRef);
  const { system, rows, label } = group;

  return (
    <div className={s.overlay} onClick={overlayClick} role="presentation">
      <div
        ref={panelRef}
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e) => trapTab(e, panelRef.current)}
      >
        <header className={s.header}>
          <span className={l.systemIcon}>{systemIcon(system.category)}</span>
          <div className={s.titleGroup}>
            <h2 className={s.title} id={titleId}>{system.name}</h2>
            {/* Under the name, not beside it: the name keeps the full width. */}
            <div className={s.meta}>
              <StatusPill label={label} text={systemStatusText(label, rows)} size="sm" />
              <span className={`${s.count} numeric`}>{countLine(rows)}</span>
            </div>
          </div>
          <button type="button" className={d.close} onClick={onClose} aria-label={t.common.close}>
            <CloseIcon />
          </button>
        </header>

        <div className={s.body}>
          {rows.length > 0 ? (
            <ul className={l.compList}>
              {rows.map((row) => (
                <ComponentLine
                  key={row.component.id}
                  row={row}
                  flash={false}
                  onOpen={() => onOpenComponent(row.component.id)}
                />
              ))}
            </ul>
          ) : null}
          {onAddComponent && (
            <button
              type="button"
              className={rows.length === 0 ? l.addSlot : l.addLink}
              onClick={() => onAddComponent(system.id)}
            >
              <PlusIcon />
              <span>{t.car.addComponent}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
