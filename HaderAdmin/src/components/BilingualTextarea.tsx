"use client";

/**
 * Bilingual textarea component for multi-line text (descriptions).
 * Renders side-by-side Arabic (RTL) and English (LTR) textareas.
 */
export default function BilingualTextarea({
  labelAr = "Description (Arabic)",
  labelEn = "Description (English)",
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  errorAr,
  errorEn,
  placeholderAr = "أدخل الوصف بالعربية",
  placeholderEn = "Enter description in English",
  required = false,
  rows = 3,
}: {
  labelAr?: string;
  labelEn?: string;
  valueAr: string;
  valueEn: string;
  onChangeAr: (value: string) => void;
  onChangeEn: (value: string) => void;
  errorAr?: string;
  errorEn?: string;
  placeholderAr?: string;
  placeholderEn?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Arabic field (RTL) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          {labelAr}
          {required && <span className="ml-0.5 text-clay">*</span>}
        </label>
        <textarea
          dir="rtl"
          value={valueAr}
          onChange={(e) => onChangeAr(e.target.value)}
          placeholder={placeholderAr}
          rows={rows}
          className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 resize-vertical ${
            errorAr ? "border-clay-deep" : "border-stone-200"
          }`}
        />
        {errorAr && (
          <p className="mt-1 text-xs text-clay-deep">{errorAr}</p>
        )}
      </div>

      {/* English field (LTR) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          {labelEn}
          {required && <span className="ml-0.5 text-clay">*</span>}
        </label>
        <textarea
          dir="ltr"
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          placeholder={placeholderEn}
          rows={rows}
          className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 resize-vertical ${
            errorEn ? "border-clay-deep" : "border-stone-200"
          }`}
        />
        {errorEn && (
          <p className="mt-1 text-xs text-clay-deep">{errorEn}</p>
        )}
      </div>
    </div>
  );
}
