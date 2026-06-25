"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Category, type Supplier } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import { type TranslationDictionary } from "@/lib/i18n/types";
import BilingualInput from "@/components/BilingualInput";
import BilingualTextarea from "@/components/BilingualTextarea";
import VariantEditor, { type VariantData, type VariantErrors } from "@/components/VariantEditor";
import ProductImageManager from "@/components/ProductImageManager";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductFormData {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  pricingUnit: string;
  price: number;
  deliveryEstimateMin: number;
  deliveryEstimateMax: number;
  deliveryEstimateUnit: string;
  available: boolean;
  madeToOrder: boolean;
  hasVariants: boolean;
  variants: VariantData[];
  imageUrl: string;
  supplierId: string;
  costPrice: number | undefined;
}

interface ProductFormProps {
  /** When provided, the form operates in edit mode. */
  initialData?: ProductFormData;
  /** Firestore document ID (required for edit mode). */
  productId?: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface FormErrors {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  categoryId?: string;
  pricingUnit?: string;
  price?: string;
  deliveryEstimateMin?: string;
  deliveryEstimateMax?: string;
  variants?: Record<string, VariantErrors>;
}

function validate(data: ProductFormData, t: TranslationDictionary): FormErrors {
  const errors: FormErrors = {};

  if (!data.nameAr.trim()) {
    errors.nameAr = t.productForm.nameArRequired;
  }
  if (!data.nameEn.trim()) {
    errors.nameEn = t.productForm.nameEnRequired;
  }
  if (!data.descriptionAr.trim()) {
    errors.descriptionAr = t.productForm.descArRequired;
  }
  if (!data.descriptionEn.trim()) {
    errors.descriptionEn = t.productForm.descEnRequired;
  }
  if (!data.categoryId) {
    errors.categoryId = t.productForm.categoryRequired;
  }
  if (!data.pricingUnit.trim()) {
    errors.pricingUnit = t.productForm.pricingUnitRequired;
  }
  if (data.price < 0) {
    errors.price = t.productForm.priceInvalid;
  }
  if (data.deliveryEstimateMin < 1) {
    errors.deliveryEstimateMin = t.productForm.deliveryMinInvalid;
  }
  if (data.deliveryEstimateMax < data.deliveryEstimateMin) {
    errors.deliveryEstimateMax = t.productForm.deliveryMaxInvalid;
  }

  // Validate variants when hasVariants is enabled
  if (data.hasVariants && data.variants.length > 0) {
    const variantErrors: Record<string, VariantErrors> = {};
    for (const v of data.variants) {
      const vErr: VariantErrors = {};
      if (!v.label_en.trim()) {
        vErr.label_en = "English label is required.";
      }
      if (!v.label_ar.trim()) {
        vErr.label_ar = "Arabic label is required.";
      }
      if (v.sellPrice < 0) {
        vErr.sellPrice = "Price must be 0 or greater.";
      }
      if (!v.pricingUnit.trim()) {
        vErr.pricingUnit = "Pricing unit is required.";
      }
      if (Object.keys(vErr).length > 0) {
        variantErrors[v.variantId] = vErr;
      }
    }
    if (Object.keys(variantErrors).length > 0) {
      errors.variants = variantErrors;
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!productId;
  const { t, locale } = useLocale();

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);
  // Suppliers for dropdown
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Pricing units for dropdown
  const [pricingUnits, setPricingUnits] = useState<{ id: string; label_ar: string; label_en: string; value?: string }[]>([]);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>(
    initialData ?? {
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      categoryId: "",
      pricingUnit: "dozen",
      price: 0,
      deliveryEstimateMin: 2,
      deliveryEstimateMax: 4,
      deliveryEstimateUnit: "days",
      available: true,
      madeToOrder: false,
      hasVariants: false,
      variants: [],
      imageUrl: "",
      supplierId: "",
      costPrice: undefined,
    }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load categories for dropdown
  useEffect(() => {
    const q = query(collection(db, "categories"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: {
            ar: data.name_ar ?? data.name?.ar ?? "",
            en: data.name_en ?? data.name?.en ?? "",
          },
          sortOrder: data.sortOrder ?? 0,
        } as Category;
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(items);
    });
    return () => unsubscribe();
  }, []);

  // Load suppliers for dropdown
  useEffect(() => {
    const q = query(collection(db, "suppliers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          handlesNote: data.handlesNote ?? "",
        } as Supplier;
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(items);
    });
    return () => unsubscribe();
  }, []);

  // Load pricing units for dropdown
  useEffect(() => {
    const q = query(collection(db, "pricingUnits"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          label_ar: data.label_ar ?? "",
          label_en: data.label_en ?? "",
          value: data.value ?? d.id,
          sortOrder: data.sortOrder ?? 0,
        };
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      setPricingUnits(items);
    });
    return () => unsubscribe();
  }, []);

  // Sync initialData when it arrives (edit mode async load)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    // Build Firestore document payload
    // IMPORTANT: Uses flat field names (name_ar, name_en, etc.) to match the iOS
    // app's Codable CodingKeys. Do NOT use nested objects like name: { ar, en }.
    const deliveryEstimateObj = {
      minValue: formData.deliveryEstimateMin,
      maxValue: formData.deliveryEstimateMax,
      unit: formData.deliveryEstimateUnit,
    };

    const supplierEntry = formData.supplierId
      ? [
          {
            supplierId: formData.supplierId,
            costPrice: formData.costPrice ?? null,
            sellPrice: formData.price,
            pricingUnit: formData.pricingUnit,
            deliveryEstimate: deliveryEstimateObj,
          },
        ]
      : [];

    const payload = {
      name_ar: formData.nameAr.trim(),
      name_en: formData.nameEn.trim(),
      description_ar: formData.descriptionAr.trim(),
      description_en: formData.descriptionEn.trim(),
      categoryId: formData.categoryId,
      pricingUnit: formData.pricingUnit,
      pricingUnitLabel_ar: pricingUnits.find((u) => (u.value ?? u.id) === formData.pricingUnit)?.label_ar ?? formData.pricingUnit,
      pricingUnitLabel_en: pricingUnits.find((u) => (u.value ?? u.id) === formData.pricingUnit)?.label_en ?? formData.pricingUnit,
      sellPrice: formData.price,
      deliveryEstimate: deliveryEstimateObj,
      inStock: formData.available,
      madeToOrder: formData.madeToOrder,
      hasVariants: formData.hasVariants,
      imageUrl: formData.imageUrl || null,
      supplierId: formData.supplierId || null,
      costPrice: formData.costPrice ?? null,
      activeSupplierIndex: 0,
      suppliers: supplierEntry,
      variants: formData.hasVariants
        ? formData.variants.map((v) => {
            const variantUnit = pricingUnits.find((u) => (u.value ?? u.id) === v.pricingUnit);
            return {
              variantId: v.variantId,
              label_ar: v.label_ar.trim(),
              label_en: v.label_en.trim(),
              sellPrice: v.sellPrice,
              pricingUnit: v.pricingUnit,
              pricingUnitLabel_ar: variantUnit?.label_ar ?? v.pricingUnit,
              pricingUnitLabel_en: variantUnit?.label_en ?? v.pricingUnit,
              inStock: v.inStock,
              ...(v.costPrice !== undefined ? { costPrice: v.costPrice } : {}),
            };
          })
        : [],
    };

    try {
      if (isEditMode) {
        await updateDoc(doc(db, "products", productId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = doc(collection(db, "products"));
        await setDoc(docRef, {
          id: docRef.id,
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      router.push("/catalog/products");
    } catch (err) {
      console.error("Failed to save product:", err);
      setSubmitError(t.productForm.saveFailed);
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Submit error banner */}
      {submitError && (
        <div className="rounded-md bg-clay-deep/10 px-4 py-3 text-sm text-clay-deep">
          {submitError}
        </div>
      )}

      {/* ---- Names ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.productName}
        </h2>
        <BilingualInput
          labelAr={t.productForm.nameAr}
          labelEn={t.productForm.nameEn}
          valueAr={formData.nameAr}
          valueEn={formData.nameEn}
          onChangeAr={(v) => updateField("nameAr", v)}
          onChangeEn={(v) => updateField("nameEn", v)}
          errorAr={errors.nameAr}
          errorEn={errors.nameEn}
          required
        />
      </section>

      {/* ---- Descriptions ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.description}
        </h2>
        <BilingualTextarea
          labelAr={t.productForm.descriptionAr}
          labelEn={t.productForm.descriptionEn}
          valueAr={formData.descriptionAr}
          valueEn={formData.descriptionEn}
          onChangeAr={(v) => updateField("descriptionAr", v)}
          onChangeEn={(v) => updateField("descriptionEn", v)}
          errorAr={errors.descriptionAr}
          errorEn={errors.descriptionEn}
          required
        />
      </section>

      {/* ---- Product Image ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.productImage}
        </h2>
        <ProductImageManager
          currentImageUrl={formData.imageUrl || undefined}
          productId={productId || `temp-${Date.now()}`}
          onImageReady={(url) => updateField("imageUrl", url)}
        />
      </section>

      {/* ---- Category ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.category}
        </h2>
        <div className="max-w-sm">
          <label className="mb-1 block text-sm font-medium text-ink">
            {t.productForm.category}<span className="ml-0.5 text-clay">*</span>
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
              errors.categoryId ? "border-clay-deep" : "border-stone-200"
            }`}
          >
            <option value="">{t.productForm.selectCategory}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name.en} — {cat.name.ar}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-xs text-clay-deep">{errors.categoryId}</p>
          )}
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.pricing}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pricing Unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.pricingUnit}<span className="ml-0.5 text-clay">*</span>
            </label>
            <select
              value={formData.pricingUnit}
              onChange={(e) => updateField("pricingUnit", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                errors.pricingUnit ? "border-clay-deep" : "border-stone-200"
              }`}
            >
              <option value="">{t.productForm.pricingUnit}</option>
              {pricingUnits.map((unit) => (
                <option key={unit.id} value={unit.value ?? unit.id}>
                  {locale === "ar" ? unit.label_ar : unit.label_en}
                </option>
              ))}
            </select>
            {errors.pricingUnit && (
              <p className="mt-1 text-xs text-clay-deep">{errors.pricingUnit}</p>
            )}
          </div>

          {/* Sell Price */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.sellPrice}
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.price}
              onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
              className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                errors.price ? "border-clay-deep" : "border-stone-200"
              }`}
            />
            {errors.price && (
              <p className="mt-1 text-xs text-clay-deep">{errors.price}</p>
            )}
          </div>
        </div>
      </section>

      {/* ---- Delivery Estimate ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.delivery}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Min */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.deliveryMin}<span className="ml-0.5 text-clay">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={formData.deliveryEstimateMin}
              onChange={(e) => updateField("deliveryEstimateMin", parseInt(e.target.value, 10) || 1)}
              className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                errors.deliveryEstimateMin ? "border-clay-deep" : "border-stone-200"
              }`}
            />
            {errors.deliveryEstimateMin && (
              <p className="mt-1 text-xs text-clay-deep">{errors.deliveryEstimateMin}</p>
            )}
          </div>

          {/* Max */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.deliveryMax}<span className="ml-0.5 text-clay">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={formData.deliveryEstimateMax}
              onChange={(e) => updateField("deliveryEstimateMax", parseInt(e.target.value, 10) || 1)}
              className={`w-full rounded-md border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40 ${
                errors.deliveryEstimateMax ? "border-clay-deep" : "border-stone-200"
              }`}
            />
            {errors.deliveryEstimateMax && (
              <p className="mt-1 text-xs text-clay-deep">{errors.deliveryEstimateMax}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.deliveryUnit}
            </label>
            <select
              value={formData.deliveryEstimateUnit}
              onChange={(e) => updateField("deliveryEstimateUnit", e.target.value)}
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
            >
              <option value="hours">{t.productForm.hours}</option>
              <option value="days">{t.productForm.days}</option>
              <option value="weeks">{t.productForm.weeks}</option>
              <option value="months">{t.productForm.months}</option>
            </select>
          </div>
        </div>
      </section>

      {/* ---- Supplier ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.supplier}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Supplier Dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.supplier}
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => updateField("supplierId", e.target.value)}
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
            >
              <option value="">{t.productForm.noSupplier}</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t.productForm.costPrice}
              <span className="ml-1 text-xs font-normal text-ink-soft">{t.productForm.costPriceOptional}</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.costPrice ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                updateField("costPrice", val === "" ? undefined : parseFloat(val));
              }}
              placeholder="e.g. 45.00"
              className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40"
            />
          </div>
        </div>
      </section>

      {/* ---- Toggles ---- */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          {t.productForm.options}
        </h2>
        <div className="space-y-4">
          {/* In Stock */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={(e) => updateField("available", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
            />
            <span className="text-sm text-ink">{t.productForm.inStockLabel}</span>
          </label>

          {/* Made to Order */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.madeToOrder}
              onChange={(e) => updateField("madeToOrder", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
            />
            <span className="text-sm text-ink">{t.productForm.madeToOrderLabel}</span>
          </label>

          {/* Has Variants */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasVariants}
              onChange={(e) => updateField("hasVariants", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
            />
            <span className="text-sm text-ink">{t.productForm.hasVariantsLabel}</span>
          </label>
        </div>
      </section>

      {/* ---- Variant Editor (shown when hasVariants is checked) ---- */}
      {formData.hasVariants && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            {t.productForm.variantConfig}
          </h2>
          <VariantEditor
            variants={formData.variants}
            onChange={(variants) => {
              setFormData((prev) => ({ ...prev, variants }));
              // Clear variant errors when variants change
              if (errors.variants) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.variants;
                  return next;
                });
              }
            }}
            errors={errors.variants}
          />
        </section>
      )}

      {/* ---- Actions ---- */}
      <div className="flex items-center gap-3 border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-clay px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.productForm.saving : isEditMode ? t.productForm.updateProduct : t.productForm.createProduct}
        </button>
        <button
          type="button"
          onClick={() => router.push("/catalog/products")}
          className="rounded-md border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-stone-50"
        >
          {t.productForm.cancel}
        </button>
      </div>
    </form>
  );
}
