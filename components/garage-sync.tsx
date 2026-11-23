"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./dialog.module.css";
import { useModal } from "@/lib/use-modal";
import { answerOffer, startSync, useSync } from "@/lib/sync";
import { useT } from "@/lib/i18n/react";

// Runs garage sync for the whole app (mounted once, in the root layout) and
// asks the one question it can't answer alone.
export default function GarageSync() {
  useEffect(startSync, []);
  const offer = useSync((st) => st.offer);
  return offer ? <ImportOffer newCars={offer.newCars} accountCars={offer.accountCars} /> : null;
}

// A guest garage meets an account that already has cars. Adding is the
// default: declining sets the browser's cars aside until sign-out, so
// neither answer loses anything.
function ImportOffer({ newCars, accountCars }: { newCars: number; accountCars: number }) {
  const titleId = useId();
  const t = useT().auth.sync;
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);

  const answer = (add: boolean) => {
    if (busy) return;
    setBusy(true);
    void answerOffer(add);
  };
  // Esc is "not now": the non-destructive answer.
  const { trapTab } = useModal(true, () => answer(false), addRef);

  return (
    <div className={s.overlay} role="presentation">
      <div
        ref={dialogRef}
        className={`${s.dialog} ${s.narrow}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={(e) => trapTab(e, dialogRef.current)}
      >
        <div className={s.header}>
          <div className={s.titleGroup}>
            <h2 className={s.title} id={titleId}>
              {t.offerTitle(newCars)}
            </h2>
            <p className={s.subtitle} id={descId}>
              {t.offerLocal(newCars)} {t.offerCloud(accountCars)}
            </p>
          </div>
        </div>
        <p className={s.hint}>
          {t.offerHint}
        </p>
        <div className={s.footer}>
          <button type="button" className={s.ghostBtn} onClick={() => answer(false)} disabled={busy}>
            {t.offerDecline}
          </button>
          <button ref={addRef} type="button" className={s.primary} onClick={() => answer(true)} disabled={busy}>
            {busy ? t.offerBusy : t.offerAccept}
          </button>
        </div>
      </div>
    </div>
  );
}
