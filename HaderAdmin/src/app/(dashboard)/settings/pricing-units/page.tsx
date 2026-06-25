"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface PricingUnit {
  id: string;
  value: string;
  label_ar: string;
  label_en: string;
  sortOrder: number;
}

export default function PricingUnitsPage() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";

  const [units, setUnits] = useState<PricingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ value: "", label_ar: "", label_en: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "pricingUnits"), orderBy("sortOrder", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PricingUnit));
      setUnits(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.value.trim() || !formData.label_ar.trim() || !formData.label_en.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "pricingUnits", editingId), {
          value: formData.value.trim(),
          label_ar: formData.label_ar.trim(),
          label_en: formData.label_en.trim(),
        });
      } else {
        await addDoc(collection(db, "pricingUnits"), {
          value: formData.value.trim(),
          label_ar: formData.label_ar.trim(),
          label_en: formData.label_en.trim(),
          sortOrder: units.length,
        });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save pricing unit:", err);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete this unit?")) return;
    await deleteDoc(doc(db, "pricingUnits", id));
  }

  function resetForm() {
    setFormData({ value: "", label_ar: "", label_en: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(unit: PricingUnit) {
    setFormData({ value: unit.value, label_ar: unit.label_ar, label_en: unit.label_en });
    setEditingId(unit.id);
    setShowForm(true);
  }

  const labels = {
    title: isAr ? "وحدات التسعير" : "Pricing Units",
    description: isAr ? "إدارة وحدات التسعير المتاحة للمنتجات" : "Manage available pricing units for products",
    addNew: isAr ? "إضافة وحدة جديدة" : "Add New Unit",
    value: isAr ? "القيمة (بالإنجليزية، بدون مسافات)" : "Value (English, no spaces)",
    labelAr: isAr ? "الاسم بالعربي" : "Arabic Label",
    labelEn: isAr ? "الاسم بالإنجليزي" : "English Label",
    save: isAr ? "حفظ" : "Save",
    cancel: isAr ? "إلغاء" : "Cancel",
    edit: isAr ? "تعديل" : "Edit",
    delete: isAr ? "حذف" : "Delete",
    empty: isAr ? "لم يتم إضافة وحدات تسعير بعد" : "No pricing units added yet",
    loading: isAr ? "جاري التحميل..." : "Loading...",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-3xl p-8">
        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mb-6 rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep"
          >
            + {labels.addNew}
          </button>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.value}</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData((p) => ({ ...p, value: e.target.value.replace(/\s/g, "_").toLowerCase() }))}
                  placeholder="e.g. case_of_24"
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.labelAr}</label>
                <input
                  type="text"
                  value={formData.label_ar}
                  onChange={(e) => setFormData((p) => ({ ...p, label_ar: e.target.value }))}
                  placeholder="كرتون ٢٤ حبة"
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.labelEn}</label>
                <input
                  type="text"
                  value={formData.label_en}
                  onChange={(e) => setFormData((p) => ({ ...p, label_en: e.target.value }))}
                  placeholder="Case of 24"
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep disabled:opacity-50"
              >
                {saving ? "..." : labels.save}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-stone-200 px-4 py-2 text-sm text-ink hover:bg-stone-50"
              >
                {labels.cancel}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-ink-soft">{labels.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{labels.value}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.labelAr}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.labelEn}</th>
                  <th className="px-4 py-3 text-end font-medium">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">{unit.value}</td>
                    <td className="px-4 py-3" dir="rtl">{unit.label_ar}</td>
                    <td className="px-4 py-3" dir="ltr">{unit.label_en}</td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => startEdit(unit)}
                        className="mr-2 text-xs text-clay hover:underline"
                      >
                        {labels.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {labels.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
