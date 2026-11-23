import type {
  Axle,
  ComponentKind,
  Condition,
  ID,
  InstalledPart,
  MaintenanceEvent,
  MaintenanceType,
  Side,
  Vehicle,
} from "./types";
import { formatKm } from "./compute";
import { formatDate, tr } from "./i18n";

export interface AddRecordInput {
  vehicleId: ID;
  type: MaintenanceType;
  date: string;
  mileageKm?: number;
  componentId?: ID;
  // fluid: FluidSpec key when the component comes from the fluid catalog.
  newComponent?: { name: string; systemId: ID; fluid?: string; axle?: Axle; side?: Side };
  costMinorUnits?: number;
  currency?: string;
  notes?: string;
  // Only for records that install a part; undefined means it is not tracked.
  resource?: { expectedLifeKm?: number; expectedLifeDays?: number };
  // Only for inspection; saved as a ComponentInspection.
  condition?: Condition;
}

export type EventPatch = Pick<
  MaintenanceEvent,
  "date" | "mileageKm" | "costMinorUnits" | "currency" | "notes"
>;

export type AddRecordResult =
  | { ok: true; event: MaintenanceEvent }
  | { ok: false; error: string };

// The part a replacement retired: same component, removed when this one went in.
export function retiredBy(part: InstalledPart, parts: InstalledPart[]): InstalledPart | undefined {
  return parts.find(
    (p) =>
      p.id !== part.id &&
      p.componentId === part.componentId &&
      p.removedAtDate === part.installedAtDate &&
      p.removedAtMileageKm === part.installedAtMileageKm,
  );
}

// A replacement swaps the part in; a purchase brings one the car didn't
// have (a spare wheel). Both install a part, so both can track its life.
export const installsPart = (type: MaintenanceType) => type === "replacement" || type === "purchase";

export function kindForNewComponent(type: MaintenanceType, tracked: boolean): ComponentKind {
  switch (type) {
    case "replacement":
    case "purchase":
      return tracked ? "consumable" : "replaceable";
    case "inspection":
      return "inspectable";
    case "fluid_service":
      return "consumable";
    default:
      return "replaceable";
  }
}

// What deleting a component takes with it, in one sentence.
export function componentDeleteEffect(componentId: ID, events: MaintenanceEvent[]): string | null {
  const own = events.filter((e) => e.componentIds.length === 1 && e.componentIds[0] === componentId).length;
  if (own === 0) return null;
  return tr().records.effectComponentHistory(own);
}

// What deleting a record changes beyond the record itself, in one sentence.
export function deleteEffect(
  event: MaintenanceEvent,
  parts: InstalledPart[],
): string | null {
  if (event.type === "inspection") return tr().records.effectInspection;
  const part = event.installedPartId ? parts.find((p) => p.id === event.installedPartId) : undefined;
  if (!part) return null;
  const active = !part.removedAtDate && part.removedAtMileageKm === undefined;
  if (!active) return null;
  const previous = retiredBy(part, parts);
  if (!previous) return tr().records.effectNoInstall;
  const when = [
    previous.installedAtDate
      ? formatDate(previous.installedAtDate, { day: "numeric", month: "short", year: "numeric" })
      : null,
    previous.installedAtMileageKm !== undefined ? formatKm(previous.installedAtMileageKm) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return tr().records.effectFromPrevious(when);
}
