"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DICT } from "./dict";

export type Locale = "id" | "en";

// A translation parameter is either a plain value, or a reference to another
// dictionary key (`{ tKey }`) so nested names (properties, categories) follow
// the active locale instead of being frozen at the time the string was built.
export type TParam = string | number | { tKey: string };
export type TParams = Record<string, TParam>;

// Core formatter — usable anywhere (components, plain modules). Looks up `key`
// in the merged dictionary, picks the `locale` variant, then interpolates
// `{token}` placeholders from `params`. Unknown keys fall back to the key
// itself so missing copy is visible rather than silently blank.
export function translate(locale: Locale, key: string, params?: TParams): string {
  const entry = DICT[key];
  let template = entry ? entry[locale] : key;
  if (params) {
    for (const [name, raw] of Object.entries(params)) {
      const value =
        typeof raw === "object" && raw !== null && "tKey" in raw
          ? translate(locale, raw.tKey)
          : String(raw);
      template = template.replaceAll(`{${name}}`, value);
    }
  }
  return template;
}

interface LocaleStore {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

export const useLocale = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: "id",
      setLocale: (locale) => set({ locale }),
      toggle: () => set({ locale: get().locale === "id" ? "en" : "id" }),
    }),
    {
      name: "konglomerat-locale",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.lang = state.locale;
        }
      },
    },
  ),
);

// Bound translator hook for components: re-renders on locale change.
export function useT(): (key: string, params?: TParams) => string {
  const locale = useLocale((s) => s.locale);
  return (key: string, params?: TParams) => translate(locale, key, params);
}

// Keep <html lang> in sync whenever the locale changes at runtime.
if (typeof window !== "undefined") {
  useLocale.subscribe((s) => {
    document.documentElement.lang = s.locale;
  });
}
