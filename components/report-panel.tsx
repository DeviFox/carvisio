"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import s from "./report-panel.module.css";
import ReportSheet from "./report-sheet";
import { ExportIcon } from "./icons";
import type { Vehicle } from "@/lib/types";
import { useT } from "@/lib/i18n/react";

type Props = {
  vehicle: Vehicle;
  onClose: () => void;
};

type Options = { costs: boolean; status: boolean };
const OPTIONS_KEY = "carvisio.report.options";

function readOptions(): Options {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    const o = raw ? (JSON.parse(raw) as Partial<Options>) : {};
    return { costs: o.costs !== false, status: o.status !== false };
  } catch {
    return { costs: true, status: true };
  }
}

// The report takes the ledger's place beside the car: options, the sheet as
// a live preview, and the print / save-as-PDF action. A second copy of the
// sheet sits at the top of <body>, hidden on screen, and is the only thing
// the printer sees: printing the page in place would drag the app along.
export default function ReportPanel({ vehicle, onClose }: Props) {
  const t = useT();
  const [today] = useState(() => new Date());
  const [options, setOptions] = useState<Options>(readOptions);

  function setOption(key: keyof Options, value: boolean) {
    const next = { ...options, [key]: value };
    setOptions(next);
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(next));
    } catch {
      // Unavailable storage only means the choice isn't remembered.
    }
  }

  // Chrome and Safari offer the page title as the PDF's file name.
  useEffect(() => {
    const before = document.title;
    document.title = t.report.docTitle(vehicle.name);
    return () => {
      document.title = before;
    };
  }, [vehicle.name, t]);

  const sheetProps = {
    vehicle,
    showCosts: options.costs,
    showStatus: options.status,
    today,
  };

  return (
    <section className={s.panel} aria-labelledby="report-panel-title">
      <div className={s.controls}>
        <div className={s.head}>
          <h2 className={s.title} id="report-panel-title">
            {t.report.title}
          </h2>
          <div className={s.actions}>
            <button type="button" className={s.closeBtn} onClick={onClose}>
              {t.report.close}
            </button>
            <button
              type="button"
              className={s.printBtn}
              onClick={() => window.print()}
            >
              <ExportIcon />
              {t.report.savePdf}
            </button>
          </div>
        </div>

        <fieldset className={s.options}>
          <legend className={s.legend}>{t.report.contents}</legend>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={options.costs}
              onChange={(e) => setOption("costs", e.target.checked)}
            />
            {t.report.optCosts}
          </label>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={options.status}
              onChange={(e) => setOption("status", e.target.checked)}
            />
            {t.report.optStatus}
          </label>
        </fieldset>
        <p className={s.hint}>
          {t.report.hint}
        </p>
      </div>

      <div className={s.body}>
        <ReportSheet {...sheetProps} inline />
      </div>
      {typeof document !== "undefined"
        ? createPortal(
            <div className={s.printRoot}>
              <ReportSheet {...sheetProps} />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
