"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  dictionaries,
  type Locale,
  type TranslationDictionary,
} from "@/lib/i18n";

interface LocaleContextValue {
  /** Current locale code. */
  locale: Locale;
  /** Full translation dictionary for the active locale. */
  t: TranslationDictionary;
  /** Switch language. Persists to localStorage and updates document dir/lang. */
  setLocale: (locale: Locale) => void;
  /** Toggle between Arabic and English. */
  toggleLocale: () => void;
  /** Whether the current locale is RTL. */
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Reads the persisted locale from localStorage (SSR-safe).
 */
function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return DEFAULT_LOCALE;
}

/**
 * Applies the locale to the <html> element's `lang` and `dir` attributes.
 */
function applyLocaleToDocument(locale: Locale) {
  const dict = dictionaries[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = dict.dir;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    applyLocaleToDocument(stored);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    applyLocaleToDocument(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = dictionaries[locale];
  const isRTL = t.dir === "rtl";

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale, toggleLocale, isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to access translations and locale state.
 * Must be used within a <LocaleProvider>.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
