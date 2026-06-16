"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VariantData {
  variantId: string;
  label_ar: string;
  label_en: string;
  sellPrice: number;
  pricingUnit: string;
  inStock: boolean;
  costPrice?: number;
}

export interface VariantErrors {
  label_en?: string;
  label_ar?: string;
  sellPrice?: string;
  pricingUnit?: string;
}

const PRICING_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "piece", label: "Piece" },
  { value: "dozen", label: "Dozen" },
  { value: "case_of_50", label: "Case (50)" },
  { value: "case_of_100", label: "Case (100)" },
  { value: "pack", label: "Pack" },
  { value: "kg", label: "Kilogram" },
  { value: "box", label: "Box" },
  { value: "roll", label: "Roll" },
  { value: "set", label: "Set" },
];

interface VariantEditorProps {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  errors?: Record<string, VariantErrors>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateVariantId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyVariant(): VariantData {
  return {
    variantId: generateVariantId(),
    label_ar: "",
    label_en: "",
    sellPrice: 0,
    pricingUnit: "dozen",
    inStock: true,
    costPrice: undefined,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VariantEditor({ variants, onChange, errors = {} }: VariantEditorProps) {
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  function addVariant() {
    onChange([...variants, createEmptyVariant()]);
  }

  function removeVariant(variantId: string) {
    onChange(variants.filter((v) => v.variantId !== variantId));
    setPendingRemoveId(null);
  }

  function updateVariant(variantId: string, field: keyof VariantData, value: VariantData[keyof VariantData]) {
    onChange(
      variants.map((v) =>
        v.variantId === variantId ? { ...v, [field]: value } : v
      )
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Variants</h3>
        <button
          type="button"
          onClick={addVariant}
          className="rounded-md bg-clay px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-clay-deep"
        >
          + Add Variant
        </button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-ink-soft">
          No variants yet. Click &ldquo;Add Variant&rdquo; to create one.
        </p>
      )}

      <div className="space-y-4">
        {variants.map((variant, index) => {
          const variantErrors = errors[variant.variantId] ?? {};
          const isConfirmingRemove = pendingRemoveId === variant.variantId;

          return (
            <div
              key={variant.variantId}
              className="rounded-md border border-stone-200 bg-stone-50 p-4"
            >
              {/* Variant header */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">
                  Variant {index + 1}
                </span>
                {isConfirmingRemove ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Remove?</span>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.variantId)}
                      className="rounded px-2 py-1 text-xs font-medium text-clay-deep transition-colors hover:bg-clay-deep/10"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemoveId(null)}
                      className="rounded px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-stone-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingRemoveId(variant.variantId)}
                    className="rounded px-2 py-1 text-xs font-medium text-clay-deep transition-colors hover:bg-clay-deep/10"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Bilingual labels */}
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Label (English)<span className="ml-0.5 text-clay">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={variant.label_en}
                    onChange={(e) => updateVariant(variant.variantId, "label_en", e.target.value)}
                    placeholder='e.g. "8oz"'
                    className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                      variantErrors.label_en ? "border-clay-deep" : "border-stone-200"
                    }`}
                  />
                  {variantErrors.label_en && (
                    <p className="mt-1 text-xs text-clay-deep">{variantErrors.label_en}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Label (Arabic)<span className="ml-0.5 text-clay">*</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={variant.label_ar}
                    onChange={(e) => updateVariant(variant.variantId, "label_ar", e.target.value)}
                    placeholder='مثال: "8 أونصة"'
                    className={`w-full rounded-md border px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                      variantErrors.label_ar ? "border-clay-deep" : "border-stone-200"
                    }`}
                  />
                  {variantErrors.label_ar && (
                    <p className="mt-1 text-xs text-clay-deep">{variantErrors.label_ar}</p>
                  )}
                </div>
              </div>

              {/* Price + pricing unit */}
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Sell Price (SAR)<span className="ml-0.5 text-clay">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={variant.sellPrice}
                    onChange={(e) =>
                      updateVariant(variant.variantId, "sellPrice", parseFloat(e.target.value) || 0)
                    }
                    className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                      variantErrors.sellPrice ? "border-clay-deep" : "border-stone-200"
                    }`}
                  />
                  {variantErrors.sellPrice && (
                    <p className="mt-1 text-xs text-clay-deep">{variantErrors.sellPrice}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Pricing Unit<span className="ml-0.5 text-clay">*</span>
                  </label>
                  <select
                    value={variant.pricingUnit}
                    onChange={(e) => updateVariant(variant.variantId, "pricingUnit", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                      variantErrors.pricingUnit ? "border-clay-deep" : "border-stone-200"
                    }`}
                  >
                    <option value="">Select unit…</option>
                    {PRICING_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {variantErrors.pricingUnit && (
                    <p className="mt-1 text-xs text-clay-deep">{variantErrors.pricingUnit}</p>
                  )}
                </div>
              </div>

              {/* Cost price + In stock toggle */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-40">
                  <label className="mb-1 block text-xs font-medium text-ink">
                    Cost Price (SAR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={variant.costPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateVariant(
                        variant.variantId,
                        "costPrice",
                        val === "" ? undefined : parseFloat(val) || 0
                      );
                    }}
                    placeholder="Optional"
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={variant.inStock}
                    onChange={(e) => updateVariant(variant.variantId, "inStock", e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
                  />
                  <span className="text-sm text-ink">In Stock</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
