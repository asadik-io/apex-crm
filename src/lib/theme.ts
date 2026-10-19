"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "apex-theme";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("storage", callback);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", callback);
  };
}

/** The theme currently applied to the page. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light",
  );
}

/** The saved preference: an explicit theme, or "system" when nothing is saved. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
      } catch {
        return "system";
      }
    },
    () => "system",
  );
}

export function applyTheme(preference: ThemePreference) {
  try {
    if (preference === "system") {
      localStorage.removeItem(STORAGE_KEY);
      document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
      document.documentElement.dataset.theme = preference;
    }
  } catch {}
}
