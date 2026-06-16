export { ar } from "./ar";
export { en } from "./en";
export type { Locale, TranslationDictionary } from "./types";

import { ar } from "./ar";
import { en } from "./en";
import { type Locale, type TranslationDictionary } from "./types";

/** All available dictionaries keyed by locale code. */
export const dictionaries: Record<Locale, TranslationDictionary> = { ar, en };

/** Default locale — Arabic, matching the iOS app. */
export const DEFAULT_LOCALE: Locale = "ar";

/** LocalStorage key for persisting language preference. */
export const LOCALE_STORAGE_KEY = "hader-admin-locale";
