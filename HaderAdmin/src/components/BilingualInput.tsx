"use client";

/**
 * Reusable bilingual input component that renders side-by-side Arabic (RTL)
 * and English (LTR) text inputs. Used across catalog forms for categories,
 * products, and variants.
 */
export default function BilingualInput({
  labelAr = "Name (Arabic)",
  labelEn = "Name (English)",
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  errorAr,
  errorEn,
  placeholderAr = "أدخل الاسم بالعربية",
  placeholderEn = "Enter name in English",
  required = false,
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
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Arabic field (RTL) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          {labelAr}
          {required && <span className="ml-0.5 text-clay">*</span>}
        </label>
        <input
          type="text"
          dir="rtl"
          value={valueAr}
          onChange={(e) => onChangeAr(e.target.value)}
          placeholder={placeholderAr}
          className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 ${
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
        <input
          type="text"
          dir="ltr"
          value={valueEn}
          onChange={(e) => onChangeEn(e.target.value)}
          placeholder={placeholderEn}
          className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 ${
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
