"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_KEY,
  getLocale,
  isPinned,
  messagesFor,
  pinLocale,
  readStoredLocale,
  setLocale,
  storeLocale,
  subscribe,
  unpinLocale,
  type Locale,
  type Messages,
} from "./index";

type PageLocale = {
  // Set on pages whose URL carries the language (/en/...): it wins over the
  // stored choice, and switching navigates to the other URL instead.
  fixed: Locale | null;
  alternates: Partial<Record<Locale, string>> | null;
};

const PageLocaleContext = createContext<PageLocale>({ fixed: null, alternates: null });

function clearPending() {
  document.documentElement.removeAttribute("data-locale-pending");
}

function applyStored() {
  setLocale(readStoredLocale() ?? DEFAULT_LOCALE, { persist: false });
}

// Mounted twice in the tree: unfixed in the root layout (the app follows the
// stored choice), and fixed inside pages that have a URL per language.
export function LocaleProvider({
  fixed = null,
  alternates = null,
  children,
}: {
  fixed?: Locale | null;
  alternates?: Partial<Record<Locale, string>> | null;
  children: React.ReactNode;
}) {
  // A fixed page's language is known before any effect: lib/ helpers called
  // during this render must already agree with it. Client only: the server
  // renders many pages in one process.
  if (fixed && typeof window !== "undefined" && (!isPinned() || getLocale() !== fixed)) pinLocale(fixed);

  useEffect(() => {
    if (fixed) {
      // Arriving on /en/ is a choice of language for the app behind it too,
      // unless the visitor already made one.
      if (!readStoredLocale()) storeLocale(fixed);
      document.documentElement.lang = fixed;
      clearPending();
      // Navigating on to an app page: back to the stored choice.
      return () => {
        unpinLocale();
        applyStored();
      };
    }
    // A fixed page inside has already set the language; its effect ran first.
    if (!isPinned()) applyStored();
    clearPending();
    // Another tab switched the language.
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_KEY) applyStored();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fixed]);

  return <PageLocaleContext.Provider value={{ fixed, alternates }}>{children}</PageLocaleContext.Provider>;
}

export function useLocale(): Locale {
  const { fixed } = useContext(PageLocaleContext);
  // The server renders the default; the stored choice arrives after hydration.
  const live = useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
  return fixed ?? live;
}

export function useT(): Messages {
  return messagesFor(useLocale());
}

export function usePageLocale(): PageLocale {
  return useContext(PageLocaleContext);
}
