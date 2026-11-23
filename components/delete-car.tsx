"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./dialog.module.css";
import { useGarage } from "@/lib/store";
import type { Vehicle } from "@/lib/types";
import { useT } from "@/lib/i18n/react";

type Props = {
  vehicle: Vehicle;
  onDelete: () => void;
};

// Two-step delete inside the car settings dialog: a quiet link, then an
// inline confirmation that says exactly what goes away.
export default function DeleteCar({ vehicle, onDelete }: Props) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const events = useGarage((s) => s.events.filter((e) => e.vehicleId === vehicle.id).length);
  const components = useGarage(
    (s) => s.components.filter((c) => c.vehicleId === vehicle.id).length,
  );
  const mileage = useGarage(
    (s) => s.mileageHistory.filter((m) => m.vehicleId === vehicle.id).length,
  );

  // Land on the safe choice so Enter doesn't delete by accident.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button type="button" className={styles.deleteLink} onClick={() => setConfirming(true)}>
        {t.car.deleteCar}
      </button>
    );
  }

  const losses = [
    events > 0 ? t.car.lossEvents(events) : null,
    components > 0 ? t.car.lossComponents(components) : null,
    mileage > 0 ? t.car.lossMileage(mileage) : null,
  ].filter(Boolean);

  return (
    <div className={styles.deleteConfirm} role="alertdialog" aria-labelledby="delete-car-title" aria-describedby="delete-car-desc">
      <p id="delete-car-title" className={styles.deleteTitle}>
        {t.car.deleteNamed(vehicle.name)}
      </p>
      <p id="delete-car-desc" className={styles.deleteText}>
        {losses.length > 0 ? t.car.lossesLine(losses.join(", ")) : ""}
        {t.records.cannotUndo}
      </p>
      <div className={styles.deleteActions}>
        <button ref={cancelRef} type="button" className={styles.ghostBtn} onClick={() => setConfirming(false)}>
          {t.records.keep}
        </button>
        <button type="button" className={styles.dangerBtn} onClick={onDelete}>
          {t.car.deleteCar}
        </button>
      </div>
    </div>
  );
}
