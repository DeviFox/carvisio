import { useState } from "react";
import s from "./position-picker.module.css";
import { useGarage } from "@/lib/store";
import { type ComponentPosition, positionLabel } from "@/lib/compute";
import { AXLES, SIDES, type Component } from "@/lib/types";
import { useT } from "@/lib/i18n/react";

type Props = {
  value: ComponentPosition;
  onChange: (next: ComponentPosition) => void;
  // Shown in place of the label, e.g. when the picker sits under a title.
  label?: string | null;
};

// Two independent toggles: axle and side. Pressing the chosen one again clears it.
export function PositionPicker({ value, onChange, label }: Props) {
  const t = useT();
  const shownLabel = label === undefined ? t.car.position : label;
  return (
    <div className={s.picker} role="group" aria-label={t.car.partPosition}>
      {shownLabel ? <span className={s.label}>{shownLabel}</span> : null}
      <div className={s.groups}>
        <Group
          options={AXLES}
          labels={t.common.axle}
          current={value.axle}
          onPick={(axle) => onChange({ ...value, axle })}
        />
        <Group
          options={SIDES}
          labels={t.common.side}
          current={value.side}
          onPick={(side) => onChange({ ...value, side })}
        />
      </div>
    </div>
  );
}

function Group<T extends string>({
  options,
  labels,
  current,
  onPick,
}: {
  options: T[];
  labels: Record<T, string>;
  current: T | undefined;
  onPick: (v: T | undefined) => void;
}) {
  return (
    <div className={s.group}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`${s.btn} ${current === o ? s.on : ""}`}
          aria-pressed={current === o}
          onClick={() => onPick(current === o ? undefined : o)}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

// Small read-only badge next to a component's name; nothing when unset.
export function PositionBadge({ value }: { value: ComponentPosition }) {
  const text = positionLabel(value);
  return text ? <span className={s.badge}>{text}</span> : null;
}

// Editable position of an existing component, saved on every press.
export function ComponentPositionField({ component }: { component: Component }) {
  const setComponentPosition = useGarage((st) => st.setComponentPosition);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={s.field}>
      <PositionPicker
        label={null}
        value={{ axle: component.axle, side: component.side }}
        onChange={(next) => setError(setComponentPosition(component.id, next))}
      />
      {error ? <span className={s.error} role="alert">{error}</span> : null}
    </div>
  );
}
