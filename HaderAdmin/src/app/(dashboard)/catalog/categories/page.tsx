"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Category } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";
import BilingualInput from "@/components/BilingualInput";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryFormData {
  name_ar: string;
  name_en: string;
  sortOrder: number;
}

interface FormErrors {
  name_ar?: string;
  name_en?: string;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name_ar: "",
    name_en: "",
    sortOrder: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("sortOrder", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: {
              ar: data.name_ar ?? data.name?.ar ?? "",
              en: data.name_en ?? data.name?.en ?? "",
            },
            sortOrder: data.sortOrder ?? 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Category;
        });
        setCategories(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load categories:", err);
        setError(t.general.error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [t.general.error]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openAddForm() {
    setEditingId(null);
    setFormData({ name_ar: "", name_en: "", sortOrder: categories.length });
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(cat: Category) {
    setEditingId(cat.id);
    setFormData({
      name_ar: cat.name.ar,
      name_en: cat.name.en,
      sortOrder: cat.sortOrder,
    });
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!formData.name_ar.trim()) errors.name_ar = t.general.required;
    if (!formData.name_en.trim()) errors.name_en = t.general.required;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name_ar: formData.name_ar.trim(),
        name_en: formData.name_en.trim(),
        sortOrder: formData.sortOrder,
      };

      if (editingId) {
        await setDoc(doc(db, "categories", editingId), payload, { merge: true });
      } else {
        const docRef = doc(collection(db, "categories"));
        await setDoc(docRef, { id: docRef.id, ...payload });
      }
      closeForm();
    } catch (err) {
      console.error("Failed to save category:", err);
      setError(t.general.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (err) {
      console.error("Failed to delete category:", err);
      setError(t.general.error);
    } finally {
      setDeletingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title={t.catalog.categories.title}
        description={t.catalog.categories.description}
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors"
          >
            {t.catalog.categories.addCategory}
          </button>
        }
      />

      <div className="p-8">
        {/* Category form (add/edit) */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {editingId ? t.catalog.categories.editCategory : t.catalog.categories.addCategory}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <BilingualInput
                valueAr={formData.name_ar}
                valueEn={formData.name_en}
                onChangeAr={(v) => setFormData((p) => ({ ...p, name_ar: v }))}
                onChangeEn={(v) => setFormData((p) => ({ ...p, name_en: v }))}
                errorAr={formErrors.name_ar}
                errorEn={formErrors.name_en}
                required
              />

              <div className="max-w-xs">
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t.catalog.categories.sortOrder}
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors disabled:opacity-50"
                >
                  {saving ? t.general.loading : t.general.save}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
                >
                  {t.general.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-clay-deep/10 px-4 py-3 text-sm text-clay-deep">
            {error}
          </div>
        )}

        {/* Categories list */}
        <CategoriesList
          categories={categories}
          loading={loading}
          deletingId={deletingId}
          onEdit={openEditForm}
          onDeleteRequest={setDeletingId}
          onDeleteConfirm={handleDelete}
          onDeleteCancel={() => setDeletingId(null)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Categories table component
// ---------------------------------------------------------------------------

function CategoriesList({
  categories,
  loading,
  deletingId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  categories: Category[];
  loading: boolean;
  deletingId: string | null;
  onEdit: (cat: Category) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const { t } = useLocale();

  if (loading) {
    return <p className="text-ink-soft">{t.general.loading}</p>;
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">{t.catalog.categories.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium text-start">{t.catalog.categories.sortOrder}</th>
            <th className="px-4 py-3 font-medium text-start">{t.catalog.categories.nameAr}</th>
            <th className="px-4 py-3 font-medium text-start">{t.catalog.categories.nameEn}</th>
            <th className="px-4 py-3 font-medium text-end">{t.general.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-stone-50">
              <td className="px-4 py-3 text-ink-soft font-mono">
                {cat.sortOrder}
              </td>
              <td className="px-4 py-3 text-ink" dir="rtl">
                {cat.name.ar}
              </td>
              <td className="px-4 py-3 text-ink">{cat.name.en}</td>
              <td className="px-4 py-3 text-end">
                {deletingId === cat.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-clay-deep">{t.catalog.categories.deleteConfirm}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteConfirm(cat.id)}
                      className="rounded bg-clay-deep px-2 py-1 text-xs text-white hover:bg-clay-deep/80"
                    >
                      {t.general.yes}
                    </button>
                    <button
                      type="button"
                      onClick={onDeleteCancel}
                      className="rounded border border-stone-200 px-2 py-1 text-xs text-ink hover:bg-stone-50"
                    >
                      {t.general.no}
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="rounded px-2 py-1 text-xs text-clay hover:bg-stone-100"
                    >
                      {t.general.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(cat.id)}
                      className="rounded px-2 py-1 text-xs text-clay-deep hover:bg-stone-100"
                    >
                      {t.general.delete}
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
