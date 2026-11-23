export type ID = string;

// Only kilometres. The field stays because the server stores it.
export type Units = "km";

export type SystemCategory =
  | "engine"
  | "transmission"
  | "brakes"
  | "suspension"
  | "tires"
  | "electrical"
  | "cooling"
  | "body"
  | "other";

export type ComponentKind = "consumable" | "replaceable" | "inspectable";

// Where a component sits on the car. Both are optional and independent:
// "передние колодки" have an axle but no side.
export type Axle = "front" | "rear";
export type Side = "left" | "right";

export const AXLES: Axle[] = ["front", "rear"];
export const SIDES: Side[] = ["left", "right"];

// Systems whose parts come in pairs or per wheel; only these offer a position.
export const POSITIONED_CATEGORIES: SystemCategory[] = ["suspension", "brakes", "tires"];

export type MaintenanceType =
  | "replacement"
  | "purchase"
  | "inspection"
  | "repair"
  | "fluid_service"
  | "observation";

export type Condition = "good" | "worn" | "critical" | "unknown";

export type MileageSource = "owner" | "service" | "estimate";

export type ReminderPriority = "low" | "normal" | "high";
export type ReminderStatus = "open" | "done" | "dismissed";

export type BodyType =
  | "sedan"
  | "hatchback"
  | "wagon"
  | "coupe"
  | "crossover"
  | "suv"
  | "pickup"
  | "minivan"
  | "van"
  | "other";

// Picker order; labels live in the i18n dictionary (common.bodyType).
export const BODY_TYPES: BodyType[] = [
  "sedan", "hatchback", "wagon", "coupe", "crossover", "suv", "pickup", "minivan", "van", "other",
];

// The systems every new car starts with, in display order. Their names come
// from the interface language at the moment the car is added.
export const SEED_SYSTEMS: SystemCategory[] = [
  "engine", "cooling", "transmission", "suspension", "brakes", "tires", "electrical", "other",
];

export interface Vehicle {
  id: ID;
  name: string;
  make: string;
  model: string;
  year?: number;
  fuelType?: string;
  engine?: string;
  bodyType?: BodyType;
  // VIN, or the body (frame) number on cars without one. Upper-case, no
  // spaces; optional, kept for later use (lookups, reports).
  vin?: string;
  // Unknown until the owner enters it; resource by mileage waits for it.
  currentMileageKm?: number;
  units: Units;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSystem {
  id: ID;
  vehicleId: ID;
  name: string;
  category: SystemCategory;
  sortOrder: number;
  isArchived: boolean;
}

export interface Component {
  id: ID;
  vehicleId: ID;
  systemId: ID;
  name: string;
  kind: ComponentKind;
  // FluidSpec key; set only for fluids created from FLUIDS.
  fluid?: string;
  axle?: Axle;
  side?: Side;
  isArchived: boolean;
}

export interface InstalledPart {
  id: ID;
  componentId: ID;
  installedAtMileageKm?: number;
  installedAtDate?: string;
  expectedLifeKm?: number;
  expectedLifeDays?: number;
  removedAtMileageKm?: number;
  removedAtDate?: string;
  notes?: string;
}

export interface MaintenanceEvent {
  id: ID;
  vehicleId: ID;
  type: MaintenanceType;
  date: string;
  mileageKm?: number;
  componentIds: ID[];
  installedPartId?: ID;
  costMinorUnits?: number;
  currency?: string;
  notes?: string;
}

export interface MileageEntry {
  id: ID;
  vehicleId: ID;
  mileageKm: number;
  date: string;
  source: MileageSource;
}

export interface ComponentInspection {
  id: ID;
  componentId: ID;
  date: string;
  mileageKm?: number;
  condition: Condition;
  notes?: string;
}

export interface MaintenanceReminder {
  id: ID;
  vehicleId: ID;
  componentId?: ID;
  title: string;
  dueAtMileageKm?: number;
  dueAtDate?: string;
  priority: ReminderPriority;
  status: ReminderStatus;
}

export interface GarageData {
  schemaVersion: number;
  vehicles: Vehicle[];
  systems: VehicleSystem[];
  components: Component[];
  installedParts: InstalledPart[];
  events: MaintenanceEvent[];
  mileageHistory: MileageEntry[];
  inspections: ComponentInspection[];
  reminders: MaintenanceReminder[];
  lastViewedVehicleId: ID | null;
}

export const SCHEMA_VERSION = 1;

export const emptyGarage = (): GarageData => ({
  schemaVersion: SCHEMA_VERSION,
  vehicles: [],
  systems: [],
  components: [],
  installedParts: [],
  events: [],
  mileageHistory: [],
  inspections: [],
  reminders: [],
  lastViewedVehicleId: null,
});

// Display names live in the i18n dictionary (common.fluidName[key]).
export interface FluidSpec {
  key: string;
  category: SystemCategory;
}

export const FLUIDS: FluidSpec[] = [
  { key: "engine_oil", category: "engine" },
  { key: "coolant", category: "cooling" },
  { key: "brake_fluid", category: "brakes" },
  { key: "transmission_oil", category: "transmission" },
  { key: "power_steering", category: "other" },
  { key: "washer", category: "body" },
];
