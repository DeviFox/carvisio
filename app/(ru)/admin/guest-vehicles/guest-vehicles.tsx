"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import shell from "@/app/page.module.css";
import AccountControl from "@/components/account-control";
import ThemeToggle from "@/components/theme-toggle";
import { api, ApiError, type GuestVehiclePage } from "@/lib/api";
import { commonAuthError, useAuth } from "@/lib/auth";
import { bodyTypeLabel, formatKm, fuelLabel } from "@/lib/compute";
import { formatDate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/react";
import styles from "./guest-vehicles.module.css";

const messages = {
  ru: {
    title: "Гостевые автомобили",
    received: "Получено",
    mileage: "Пробег при добавлении",
    empty: "Гости пока не добавляли автомобили.",
    loading: "Загружаем автомобили…",
    unavailable: "Нет доступа к гостевым автомобилям.",
    next: "Более ранние",
    latest: "К последним",
  },
  en: {
    title: "Guest vehicles",
    received: "Received",
    mileage: "Mileage when added",
    empty: "Guests haven't added any vehicles yet.",
    loading: "Loading vehicles…",
    unavailable: "You don't have access to guest vehicles.",
    next: "Older",
    latest: "Back to latest",
  },
};

export default function GuestVehicles() {
  const m = messages[useLocale()];
  const t = useT();
  const status = useAuth((s) => s.status);
  const userId = useAuth((s) => s.user?.id);

  return (
    <div className={shell.shell}>
      <main className={`${shell.main} ${styles.main}`}>
        <div className={styles.top}>
          <Link href="/">{t.garage.toGarage}</Link>
          <div className={styles.actions}>
            <ThemeToggle />
            <AccountControl />
          </div>
        </div>
        <h1 className={shell.h1}>{m.title}</h1>
        {status === "unknown" && <p role="status">{m.loading}</p>}
        {status === "guest" && <p>{m.unavailable}</p>}
        {status === "user" && userId && <GuestVehicleList key={userId} />}
      </main>
    </div>
  );
}

function GuestVehicleList() {
  const m = messages[useLocale()];
  const t = useT();
  const [before, setBefore] = useState<number>();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    before?: number;
    attempt: number;
    page?: GuestVehiclePage;
    error?: unknown;
  }>();

  useEffect(() => {
    let active = true;
    void api.guestVehicles(before).then(
      (page) => { if (active) setResult({ before, attempt, page }); },
      (error: unknown) => { if (active) setResult({ before, attempt, error }); },
    );
    return () => { active = false; };
  }, [before, attempt]);

  if (!result || result.before !== before || result.attempt !== attempt) {
    return <p role="status">{m.loading}</p>;
  }
  if (!result.page) {
    const err = result.error;
    if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
      return <p>{m.unavailable}</p>;
    }
    return (
      <div className={styles.actions}>
        <p role="alert">{commonAuthError(err)}</p>
        <button type="button" className={shell.primaryBtn} onClick={() => setAttempt(attempt + 1)}>{t.car.retry}</button>
      </div>
    );
  }

  const { vehicles, nextBefore } = result.page;
  const headings = [t.car.make, t.car.model, t.car.year, t.car.bodyType, t.car.fuel, t.car.engine, m.mileage, t.car.vin, m.received];
  return (
    <>
      {vehicles.length === 0 ? <p>{m.empty}</p> : (
        <div className={styles.tableScroll} role="region" aria-label={m.title} tabIndex={0}>
          <table className={styles.table}>
            <thead><tr>{headings.map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.make}</td>
                  <td>{v.model}</td>
                  <td>{v.year}</td>
                  <td>{bodyTypeLabel(v.bodyType) ?? "—"}</td>
                  <td>{fuelLabel(v.fuelType) ?? "—"}</td>
                  <td>{v.engine ?? "—"}</td>
                  <td className="numeric">{v.currentMileageKm === undefined ? "—" : formatKm(v.currentMileageKm)}</td>
                  <td className="mono">{v.vin ?? "—"}</td>
                  <td><time dateTime={v.receivedAt}>{formatDate(v.receivedAt, {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(before !== undefined || nextBefore !== undefined) && (
        <div className={styles.actions}>
          {before !== undefined && <button type="button" className={shell.primaryBtn} onClick={() => setBefore(undefined)}>{m.latest}</button>}
          {nextBefore !== undefined && <button type="button" className={shell.primaryBtn} onClick={() => setBefore(nextBefore)}>{m.next}</button>}
        </div>
      )}
    </>
  );
}
