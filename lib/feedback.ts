"use client";

import { create } from "zustand";

// Shown in the footer and sent with each feedback message.
export const APP_VERSION = "1.0.0 beta";
// Same bound as the server (server/internal/feedback), in characters.
export const FEEDBACK_MAX = 2000;

// The feedback dialog opens from more than one place (the footer, the last
// page of the "how it works" story), so its open state is shared.
type FeedbackState = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

export const useFeedback = create<FeedbackState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
