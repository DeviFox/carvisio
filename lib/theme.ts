// Colour theme: the owner's choice ("system" by default) and the resolved
// light/dark written to <html data-theme>. globals.css keys the dark palette
// off that attribute only, so the inline script in the root layout must set it
// before first paint; this module keeps it in step afterwards.

export type ThemePref = "system" | "light" | "dark";

export const THEME_KEY = "carvisio.theme";
const QUERY = "(prefers-color-scheme: dark)";

// Runs inline in <head> before the page paints, so a dark-theme visitor never
// sees a white flash. Keep it dependency-free and in sync with resolve() below.
export const THEME_BOOT_SCRIPT = `(function(){var p;try{p=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}var d=p==="dark"||(p!=="light"&&window.matchMedia&&matchMedia(${JSON.stringify(QUERY)}).matches);document.documentElement.dataset.theme=d?"dark":"light"})()`;

function isPref(v: unknown): v is ThemePref {
  return v === "system" || v === "light" || v === "dark";
}

export function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isPref(v) ? v : "system";
  } catch {
    return "system";
  }
}

function resolve(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia?.(QUERY).matches ? "dark" : "light";
}

function apply(pref: ThemePref) {
  document.documentElement.dataset.theme = resolve(pref);
}

const listeners = new Set<() => void>();

export function setPref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  current = pref;
  apply(pref);
  listeners.forEach((l) => l());
}

let current: ThemePref | null = null;

export function getPref(): ThemePref {
  if (current === null) current = readPref();
  return current;
}

// For useSyncExternalStore. Also follows the OS while the choice is "system",
// and another tab changing the choice.
export function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia?.(QUERY);
  const onMedia = () => {
    if (getPref() === "system") apply("system");
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    current = isPref(e.newValue) ? e.newValue : "system";
    apply(current);
    listener();
  };
  media?.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
  };
}
