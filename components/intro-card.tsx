"use client";

import { useId, useRef, useState } from "react";
import s from "./intro-card.module.css";
import d from "./dialog.module.css";
import StatusPill from "./status-pill";
import { useModal } from "@/lib/use-modal";
import { formatKm } from "@/lib/compute";
import { formatNumber, type Messages } from "@/lib/i18n";
import { useT } from "@/lib/i18n/react";

// First-run story about the few ideas carvisio rests on, as a modal: opens by
// itself on the first visit to an empty garage, and from "как это работает".
const STORAGE_KEY = "carvisio.intro.dismissed";

export function introDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode or blocked storage: the card just shows again next time.
  }
}

type Page = { title: string; body: string; art: React.ReactNode };

function pages(t: Messages): Page[] {
  const i = t.garage.intro;
  const st = t.common.status;
  return [
    {
      ...i.systems,
      art: (
        <ul className={s.rows}>
          <li><span className={s.rowName}>{t.common.systemName.brakes}</span><StatusPill label="ok" text={st.ok} size="sm" /></li>
          <li><span className={s.rowName}>{t.common.systemName.tires}</span><StatusPill label="attention" text={st.replaceSoon} size="sm" /></li>
          <li><span className={s.rowName}>{t.common.systemName.suspension}</span><StatusPill label="unknown" text={st.noData} size="sm" /></li>
        </ul>
      ),
    },
    {
      title: i.replacement.title,
      body: i.replacement.body,
      art: (
        <div className={s.part}>
          <div className={s.partHead}>
            <span className={s.rowName}>{i.replacement.part}</span>
            <StatusPill label="ok" text={st.ok} size="sm" />
          </div>
          <div className={s.bar}><span style={{ width: "48%" }} /></div>
          <div className={`${s.barText} numeric`}><strong>48%</strong> {t.common.left(formatKm(14500))}</div>
        </div>
      ),
    },
    {
      title: i.mileage.title,
      body: i.mileage.body,
      art: (
        <div className={s.odo}>
          <span className={s.odoLabel}>{i.mileage.current}</span>
          <span className={`${s.odoValue} mono numeric`}>{formatNumber(87500)}<small>{i.mileage.unit}</small></span>
          <span className={s.odoBtn}>{t.records.updateMileage}</span>
        </div>
      ),
    },
    {
      ...i.repeat,
      art: (
        <div className={s.field}>
          <span className={s.fieldLabel}>{t.records.cost}</span>
          <span className={`${s.fieldInput} numeric`}>8450</span>
          <span className={s.fieldHint}>{t.records.costCarried}</span>
        </div>
      ),
    },
  ];
}

export default function IntroCard({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const t = useT();
  const PAGES = pages(t);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const current = PAGES[page];
  const dialogRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  function close() {
    rememberDismissed();
    onClose();
  }
  // Esc and a click outside count as "Пропустить"; focus starts on "Далее".
  const { overlayClick, trapTab } = useModal(true, close, nextRef);

  return (
    <div className={d.overlay} onClick={overlayClick} role="presentation">
    <div
      ref={dialogRef}
      className={s.card}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => trapTab(e, dialogRef.current)}
    >
      <h2 id={titleId} className="sr-only">{t.garage.intro.heading}</h2>

      {/* Announce only where the reader is, not the whole page again. */}
      <p className="sr-only" aria-live="polite">
        {t.garage.intro.announce(page + 1, PAGES.length, current.title)}
      </p>
      {/* Keyed by page so each one fades in. */}
      <div key={page} className={s.page}>
        <div className={s.text}>
          <span className={`${s.counter} mono`}>{t.garage.intro.pageOf(page + 1, PAGES.length)}</span>
          <h3 className={s.title}>{current.title}</h3>
          <p className={s.body}>{current.body}</p>
        </div>
        <div className={s.art} aria-hidden="true">
          <span className={s.example}>{t.garage.intro.example}</span>
          {current.art}
        </div>
      </div>

      <div className={s.footer}>
        {last ? (
          <span className={s.reopenHint}>{t.garage.intro.reopenHint}</span>
        ) : (
          <button type="button" className={s.skip} onClick={close}>{t.garage.intro.skip}</button>
        )}
        <div className={s.nav}>
          <span className={s.dots} aria-hidden="true">
            {PAGES.map((_, i) => (
              <span key={i} className={`${s.dot} ${i === page ? s.dotOn : ""}`} />
            ))}
          </span>
          {page > 0 ? (
            <button type="button" className={d.ghostBtn} onClick={() => setPage(page - 1)}>{t.garage.intro.back}</button>
          ) : null}
          <button ref={nextRef} type="button" className={d.primary} onClick={last ? close : () => setPage(page + 1)}>
            {last ? t.garage.intro.done : t.garage.intro.next}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
