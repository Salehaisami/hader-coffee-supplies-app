"use client";

import { useLocale } from "@/contexts/LocaleContext";

/**
 * Compact language toggle button. Shows the alternate language name
 * so users can switch between Arabic and English.
 */
export default function LanguageToggle({ variant = "sidebar" }: { variant?: "sidebar" | "inline" }) {
  const { locale, toggleLocale, t } = useLocale();

  // Show the label of the OTHER language so users know what they're switching to
  const switchLabel = locale === "ar" ? t.language.english : t.language.arabic;

  if (variant === "sidebar") {
    return (
      <button
        onClick={toggleLocale}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-800 hover:text-white"
        aria-label={t.language.toggle}
      >
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
          />
        </svg>
        {switchLabel}
      </button>
    );
  }

  // Inline variant for use in pages
  return (
    <button
      onClick={toggleLocale}
      className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-stone-100 hover:text-ink"
      aria-label={t.language.toggle}
    >
      {switchLabel}
    </button>
  );
}
