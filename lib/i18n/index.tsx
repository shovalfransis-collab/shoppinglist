"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { en } from "./en";
import { he } from "./he";
import { LANG_STORAGE_KEY } from "./script";
import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, type Dictionary, type Locale } from "./types";

export type { Dictionary, ErrorCode, Locale } from "./types";

export const dictionaries: Record<Locale, Dictionary> = { en, he };

// The current language lives on <html lang>, which the inline script sets before paint.
// useSyncExternalStore lets React read it without a hydration mismatch.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  const lang = document.documentElement.lang as Locale;
  return LOCALES.includes(lang) ? lang : DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function applyLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode); the choice just won't be remembered.
  }
  listeners.forEach((l) => l());
}

type I18n = { locale: Locale; t: Dictionary; setLocale: (locale: Locale) => void };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = dictionaries[locale];

  useEffect(() => {
    // Browser-tab title and description follow the language too.
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description);
    // Lets the CSS reveal the page (it is hidden until now for Hebrew, to avoid an English flash).
    document.body.dataset.hydrated = "";
  }, [t]);

  return <I18nContext value={{ locale, t, setLocale: applyLocale }}>{children}</I18nContext>;
}

function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}

// The dictionary for the current language: const t = useT(); t.addItem
export function useT(): Dictionary {
  return useI18n().t;
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
