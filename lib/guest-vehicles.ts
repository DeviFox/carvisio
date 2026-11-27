"use client";

import { api, ApiError, type GuestVehicleFields, type GuestVehicleSubmission } from "./api";
import { useAuth } from "./auth";
import { newId, useGarage } from "./store";

const storagePrefix = "carvisio.guest-vehicle.v1.";
const pending = new Map<string, GuestVehicleSubmission>();
let sending = false;

export function recordGuestVehicle(fields: GuestVehicleFields) {
  if (useGarage.getState().ownerId !== null) return;

  function queue() {
    const { make, model, year, fuelType, engine, bodyType, vin, currentMileageKm } = fields;
    const submission = { submissionId: newId(), make, model, year, fuelType, engine, bodyType, vin, currentMileageKm };
    pending.set(submission.submissionId, submission);
    try {
      localStorage.setItem(storagePrefix + submission.submissionId, JSON.stringify(submission));
    } catch {
      // The active tab can still send the submission.
    }
    void flush();
  }

  const auth = useAuth.getState();
  if (auth.status === "guest") queue();
  if (auth.status === "unknown") {
    const unsubscribe = useAuth.subscribe(({ status }) => {
      if (status === "unknown") return;
      unsubscribe();
      if (status === "guest") queue();
    });
    auth.load();
  }
}

async function flush() {
  if (sending || !navigator.onLine) return;
  sending = true;
  try {
    for (const [id, submission] of pending) {
      try {
        await api.submitGuestVehicle(submission);
      } catch (err) {
        const invalid = err instanceof ApiError && [400, 413, 422].includes(err.status);
        if (!invalid) break;
      }
      pending.delete(id);
      try {
        localStorage.removeItem(storagePrefix + id);
      } catch {
        // If removal failed, the server can accept the same submission again.
      }
    }
  } finally {
    sending = false;
  }
}

export function startGuestVehicleSync() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(storagePrefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const id = key.slice(storagePrefix.length);
      try {
        const submission = JSON.parse(raw) as GuestVehicleSubmission;
        if (submission?.submissionId === id) pending.set(id, submission);
      } catch {
        // One damaged entry should not prevent the remaining submissions.
      }
    }
  } catch {
    // Browser storage is unavailable.
  }

  const onOnline = () => { void flush(); };
  const onVisible = () => {
    if (document.visibilityState === "visible") onOnline();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  onOnline();
  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
