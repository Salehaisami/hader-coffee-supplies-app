"use client";

import { useEffect, useState, useMemo } from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Product, type Supplier } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupplierFormData {
  name: string;
  phone: string;
  email: string;
  handlesNote: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    phone: "",
    email: "",
    handlesNote: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Products state — used to compute supplier linkage
  const [products, setProducts] = useState<Product[]>([]);

  // Real-time listener — sorted alphabetically by name
  useEffect(() => {
    const q = query(collection(db, "suppliers"), orderBy("name", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            handlesNote: data.handlesNote ?? "",
            createdAt: data.createdAt,
          } as Supplier;
        });
        setSuppliers(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load suppliers:", err);
        setError("Could not load suppliers. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Products listener — fetch products to determine supplier linkage
  useEffect(() => {
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data } as Product;
        });
        setProducts(items);
      },
      (err) => {
        console.error("Failed to load products for linkage:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Build a map: supplierId -> list of product names (English)
  const supplierProductMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const product of products) {
      const linkedIds = new Set<string>();

      // Check top-level supplierId
      if (product.supplierId) {
        linkedIds.add(product.supplierId);
      }

      // Check suppliers array if present (some products may have this)
      const suppliersArray = (product as unknown as Record<string, unknown>)["suppliers"];
      if (Array.isArray(suppliersArray)) {
        for (const entry of suppliersArray) {
          if (entry && typeof entry === "object" && "supplierId" in entry) {
            const sid = (entry as { supplierId: string }).supplierId;
            if (sid) linkedIds.add(sid);
          }
        }
      }

      for (const sid of linkedIds) {
        if (!map[sid]) map[sid] = [];
        const raw = product as unknown as Record<string, unknown>;
        const name = (raw.name_en as string) || (raw.name as {en?: string})?.en || (raw.name_ar as string) || "Unnamed";
        map[sid].push(name);
      }
    }
    return map;
  }, [products]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function openAddForm() {
    setEditingId(null);
    setFormData({ name: "", phone: "", email: "", handlesNote: "" });
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(supplier: Supplier) {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      handlesNote: supplier.handlesNote ?? "",
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
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        handlesNote: formData.handlesNote.trim(),
      };

      if (editingId) {
        await updateDoc(doc(db, "suppliers", editingId), payload);
      } else {
        const docRef = doc(collection(db, "suppliers"));
        await setDoc(docRef, {
          id: docRef.id,
          ...payload,
          createdAt: serverTimestamp(),
        });
      }
      closeForm();
    } catch (err) {
      console.error("Failed to save supplier:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "suppliers", id));
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      setError("Failed to delete. Please try again.");
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
        title="Suppliers"
        description="Manage supplier contacts and what they handle."
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors"
          >
            Add Supplier
          </button>
        }
      />

      <div className="p-8">
        {/* Supplier form (add/edit) */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {editingId ? "Edit Supplier" : "Add Supplier"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Name <span className="text-clay-deep">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  placeholder="Supplier name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-clay-deep">{formErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Phone <span className="text-clay-deep">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  placeholder="+966 5x xxx xxxx"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-clay-deep">{formErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Email <span className="text-clay-deep">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  placeholder="supplier@example.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-clay-deep">{formErrors.email}</p>
                )}
              </div>

              {/* Handles Note */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Handles Note
                </label>
                <textarea
                  value={formData.handlesNote}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, handlesNote: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  placeholder="Categories or products this supplier covers…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
                >
                  Cancel
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

        {/* Suppliers list */}
        <SuppliersList
          suppliers={suppliers}
          loading={loading}
          deletingId={deletingId}
          supplierProductMap={supplierProductMap}
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
// Suppliers table component
// ---------------------------------------------------------------------------

function SuppliersList({
  suppliers,
  loading,
  deletingId,
  supplierProductMap,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  suppliers: Supplier[];
  loading: boolean;
  deletingId: string | null;
  supplierProductMap: Record<string, string[]>;
  onEdit: (supplier: Supplier) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  if (loading) {
    return <p className="text-ink-soft">Loading suppliers…</p>;
  }

  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">No suppliers yet. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Handles</th>
            <th className="px-4 py-3 font-medium">Linked Products</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-stone-50">
              <td className="px-4 py-3 font-medium text-ink">
                {supplier.name}
              </td>
              <td className="px-4 py-3 text-ink-soft">{supplier.phone}</td>
              <td className="px-4 py-3 text-ink-soft">{supplier.email}</td>
              <td className="px-4 py-3 text-ink-soft max-w-[200px] truncate">
                {supplier.handlesNote || "—"}
              </td>
              <td className="px-4 py-3 text-ink-soft max-w-[200px]">
                <LinkedProductsCell names={supplierProductMap[supplier.id] ?? []} />
              </td>
              <td className="px-4 py-3 text-right">
                {deletingId === supplier.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-clay-deep">Delete?</span>
                    <button
                      type="button"
                      onClick={() => onDeleteConfirm(supplier.id)}
                      className="rounded bg-clay-deep px-2 py-1 text-xs text-white hover:bg-clay-deep/80"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={onDeleteCancel}
                      className="rounded border border-stone-200 px-2 py-1 text-xs text-ink hover:bg-stone-50"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(supplier)}
                      className="rounded px-2 py-1 text-xs text-clay hover:bg-stone-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(supplier.id)}
                      className="rounded px-2 py-1 text-xs text-clay-deep hover:bg-stone-100"
                    >
                      Delete
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

// ---------------------------------------------------------------------------
// Linked products cell — shows count and truncated names
// ---------------------------------------------------------------------------

const MAX_DISPLAY_NAMES = 2;

function LinkedProductsCell({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-ink-soft/60">None</span>;
  }

  const displayed = names.slice(0, MAX_DISPLAY_NAMES).join(", ");
  const remaining = names.length - MAX_DISPLAY_NAMES;

  return (
    <span className="text-ink-soft text-xs" title={names.join(", ")}>
      <span className="font-medium text-ink">{names.length} product{names.length !== 1 ? "s" : ""}</span>
      <span className="block truncate max-w-[180px]">
        {displayed}
        {remaining > 0 && `, +${remaining} more`}
      </span>
    </span>
  );
}
