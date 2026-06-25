"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type User, type UserStatus } from "@/lib/types";
import { formatTimestamp, googleMapsSearchUrl } from "@/lib/format";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

/** Filter options for the customers list. */
type StatusFilter = "all" | UserStatus;

/** Status badge color mapping using Stone/Ink/Clay/Sage tokens. */
const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
  pending: "bg-clay/10 text-clay-deep",
  approved: "bg-sage/15 text-sage",
  suspended: "bg-stone-200 text-stone-600",
};

function CustomerStatusBadge({ status }: { status: UserStatus }) {
  const { t } = useLocale();
  const classes = STATUS_BADGE_CLASSES[status] ?? "bg-stone-100 text-stone-600";
  const label = t.customers.filters[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

function filterCustomers(customers: User[], filter: StatusFilter): User[] {
  if (filter === "all") return customers;
  return customers.filter((c) => c.status === filter);
}

/** Tracks which customer is being confirmed for a status action. */
interface ConfirmingAction {
  customerId: string;
  targetStatus: UserStatus;
}

// ---------------------------------------------------------------------------
// Customer creation form types
// ---------------------------------------------------------------------------

interface CustomerFormData {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  street: string;
  notes: string;
}

interface CustomerFormErrors {
  businessName?: string;
  contactName?: string;
  phone?: string;
}

const EMPTY_FORM: CustomerFormData = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  city: "Jeddah",
  district: "",
  street: "",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t, locale } = useLocale();

  // Action state
  const [confirming, setConfirming] = useState<ConfirmingAction | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add customer form state
  const [showForm, setShowForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const customersQuery = query(
      collection(db, "users"),
      where("role", "==", "customer"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        const next = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as User
        );
        setCustomers(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load customers:", err);
        setError(t.general.error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [t.general.error]);

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter]);

  async function handleStatusUpdate(customerId: string, newStatus: UserStatus) {
    setUpdatingId(customerId);
    setConfirming(null);
    try {
      await updateDoc(doc(db, "users", customerId), { status: newStatus });
    } catch (err) {
      console.error("Failed to update customer status:", err);
      setError(t.general.error);
    } finally {
      setUpdatingId(null);
    }
  }

  /** Bulk delete selected customers. */
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmMsg = locale === "ar"
      ? `هل أنت متأكد من حذف ${selectedIds.size} عميل؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete ${selectedIds.size} customer(s)? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteDoc(doc(db, "users", id)))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk delete failed:", err);
      setError(locale === "ar" ? "فشل الحذف الجماعي" : "Bulk delete failed");
    }
  }

  function openAddForm() {
    setEditingCustomerId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(customer: User) {
    setEditingCustomerId(customer.id);
    setFormData({
      businessName: customer.businessName ?? "",
      contactName: customer.contactName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      city: customer.deliveryAddress?.city ?? "Jeddah",
      district: "",
      street: "",
      notes: "",
    });
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCustomerId(null);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: CustomerFormErrors = {};
    if (!formData.businessName.trim()) errors.businessName = t.general.required;
    if (!formData.contactName.trim()) errors.contactName = t.general.required;
    if (!formData.phone.trim()) errors.phone = t.general.required;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        businessName: formData.businessName.trim(),
        contactName: formData.contactName.trim(),
        phone: formData.phone.trim(),
      };

      if (formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      // Parse delivery address from maps link or raw coordinates
      if (formData.district.trim()) {
        const coords = extractCoordinates(formData.district.trim());
        if (coords) {
          payload.deliveryAddress = {
            city: "Jeddah",
            district: "—",
            lat: coords.lat,
            lng: coords.lng,
          };
        }
      }

      if (editingCustomerId) {
        await updateDoc(doc(db, "users", editingCustomerId), payload);
      } else {
        payload.role = "customer";
        payload.status = "approved";
        payload.createdAt = serverTimestamp();
        const docRef = doc(collection(db, "users"));
        await setDoc(docRef, { id: docRef.id, ...payload });
      }
      closeForm();
    } catch (err) {
      console.error("Failed to save customer:", err);
      setError(t.general.error);
    } finally {
      setSaving(false);
    }
  }

  function extractCoordinates(url: string): { lat: number; lng: number } | null {
    const googleAt = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (googleAt) return { lat: parseFloat(googleAt[1]), lng: parseFloat(googleAt[2]) };
    const googleQ = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (googleQ) return { lat: parseFloat(googleQ[1]), lng: parseFloat(googleQ[2]) };
    const googleQuery = url.match(/query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (googleQuery) return { lat: parseFloat(googleQuery[1]), lng: parseFloat(googleQuery[2]) };
    const appleLl = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (appleLl) return { lat: parseFloat(appleLl[1]), lng: parseFloat(appleLl[2]) };
    const raw = url.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (raw) return { lat: parseFloat(raw[1]), lng: parseFloat(raw[2]) };
    return null;
  }

  const filteredCustomers = filterCustomers(customers, statusFilter);

  const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
    all: t.customers.filters.all,
    pending: t.customers.filters.pending,
    approved: t.customers.filters.approved,
    suspended: t.customers.filters.suspended,
  };

  return (
    <div>
      <PageHeader
        title={t.customers.title}
        description={t.customers.description}
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors"
          >
            {t.customers.addCustomer}
          </button>
        }
      />
      <div className="p-8">
        {/* Add customer inline form */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              {editingCustomerId ? (locale === "ar" ? "تعديل العميل" : "Edit Customer") : t.customers.addCustomer}
            </h2>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {t.customers.fields.businessName} <span className="text-clay-deep">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))}
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  />
                  {formErrors.businessName && (
                    <p className="mt-1 text-xs text-clay-deep">{formErrors.businessName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {t.customers.fields.contactName} <span className="text-clay-deep">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  />
                  {formErrors.contactName && (
                    <p className="mt-1 text-xs text-clay-deep">{formErrors.contactName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {t.customers.fields.phone} <span className="text-clay-deep">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    dir="ltr"
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                    placeholder="+966 5xxxxxxxx"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-clay-deep">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {t.customers.fields.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    dir="ltr"
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                  />
                </div>
              </div>

              {/* Delivery address — paste a maps link */}
              <div className="border-t border-stone-100 pt-4">
                <p className="mb-2 text-sm font-medium text-ink">
                  {t.customers.fields.deliveryAddress}
                </p>

                {/* Show current saved location when editing */}
                {editingCustomerId && (() => {
                  const editingCustomer = customers.find((c) => c.id === editingCustomerId);
                  if (editingCustomer?.deliveryAddress) {
                    return (
                      <div className="mb-3 flex items-center gap-2 rounded-md bg-stone-50 px-3 py-2">
                        <span className="text-xs text-ink-soft">
                          {locale === "ar" ? "الموقع الحالي:" : "Current location:"}
                        </span>
                        <a
                          href={googleMapsSearchUrl(editingCustomer.deliveryAddress.lat, editingCustomer.deliveryAddress.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-clay hover:underline"
                        >
                          {locale === "ar" ? "عرض على الخريطة ↗" : "View on Map ↗"}
                        </a>
                      </div>
                    );
                  }
                  return null;
                })()}

                <p className="mb-2 text-xs text-ink-soft">
                  {locale === "ar"
                    ? "الصق رابط خرائط جوجل أو أبل لتحديث موقع العميل"
                    : "Paste a Google Maps or Apple Maps link to update the delivery location"}
                </p>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))}
                  dir="ltr"
                  placeholder="https://maps.google.com/... or 21.52, 39.23"
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

        {/* Status filter tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1 w-fit">
          {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {STATUS_FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-clay-deep/10 px-4 py-3 text-sm text-clay-deep">
            {error}
          </div>
        )}

        <CustomersContent
          customers={filteredCustomers}
          loading={loading}
          error={error}
          confirming={confirming}
          updatingId={updatingId}
          onActionRequest={(customerId, targetStatus) =>
            setConfirming({ customerId, targetStatus })
          }
          onActionConfirm={(customerId, targetStatus) =>
            handleStatusUpdate(customerId, targetStatus)
          }
          onActionCancel={() => setConfirming(null)}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onEdit={openEditForm}
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm font-medium text-ink">
              {locale === "ar"
                ? `${selectedIds.size} محدد`
                : `${selectedIds.size} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                {locale === "ar" ? "حذف المحدد" : "Delete Selected"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
              >
                {locale === "ar" ? "إلغاء التحديد" : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersContent({
  customers,
  loading,
  error,
  confirming,
  updatingId,
  onActionRequest,
  onActionConfirm,
  onActionCancel,
  selectedIds,
  setSelectedIds,
  onEdit,
}: {
  customers: User[];
  loading: boolean;
  error: string | null;
  confirming: ConfirmingAction | null;
  updatingId: string | null;
  onActionRequest: (customerId: string, targetStatus: UserStatus) => void;
  onActionConfirm: (customerId: string, targetStatus: UserStatus) => void;
  onActionCancel: () => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onEdit: (customer: User) => void;
}) {
  const { t, locale } = useLocale();

  const allSelected = customers.length > 0 && customers.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return <p className="text-ink-soft">{t.general.loading}</p>;
  }

  if (error) {
    return <p className="text-clay-deep">{error}</p>;
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">{t.customers.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium text-start">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
              />
            </th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.businessName}</th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.contactName}</th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.phone}</th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.email}</th>
            <th className="px-4 py-3 font-medium text-start">{locale === "ar" ? "الموقع" : "Location"}</th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.status}</th>
            <th className="px-4 py-3 font-medium text-start">{t.customers.fields.createdAt}</th>
            <th className="px-4 py-3 font-medium text-start">{t.general.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {customers.map((customer) => {
            const isConfirming = confirming?.customerId === customer.id;
            const isUpdating = updatingId === customer.id;

            return (
              <tr key={customer.id} className={`hover:bg-stone-50 ${selectedIds.has(customer.id) ? "bg-clay/5" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(customer.id)}
                    onChange={() => toggleSelect(customer.id)}
                    className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-ink">{customer.businessName}</td>
                <td className="px-4 py-3 text-ink">{customer.contactName || "—"}</td>
                <td className="px-4 py-3 text-ink-soft" dir="ltr">{customer.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-soft" dir="ltr">{customer.email || "—"}</td>
                <td className="px-4 py-3">
                  {customer.deliveryAddress ? (
                    <a
                      href={googleMapsSearchUrl(customer.deliveryAddress.lat, customer.deliveryAddress.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-clay hover:underline"
                    >
                      {locale === "ar" ? "عرض" : "Map"}
                    </a>
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <CustomerStatusBadge status={customer.status} />
                </td>
                <td className="px-4 py-3 text-ink-soft" dir="ltr">
                  {formatTimestamp(customer.createdAt, locale)}
                </td>
                <td className="px-4 py-3">
                  {!isConfirming && !isUpdating && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-clay hover:bg-stone-100 transition-colors"
                      >
                        {t.general.edit}
                      </button>
                      {customer.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => onActionRequest(customer.id, "approved")}
                          className="rounded-md px-3 py-1.5 text-xs font-medium bg-sage/15 text-sage hover:bg-sage/25 transition-colors"
                        >
                          {t.customers.actions.approve}
                        </button>
                      )}
                      {customer.status !== "suspended" && (
                        <button
                          type="button"
                          onClick={() => onActionRequest(customer.id, "suspended")}
                          className="rounded-md px-3 py-1.5 text-xs font-medium bg-clay-deep/10 text-clay-deep hover:bg-clay-deep/20 transition-colors"
                        >
                          {t.customers.actions.suspend}
                        </button>
                      )}
                    </div>
                  )}

                  {isConfirming && confirming && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-ink">
                        {confirming.targetStatus === "approved"
                          ? t.customers.actions.approveConfirm
                          : t.customers.actions.suspendConfirm}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={onActionCancel}
                          className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-ink transition-colors hover:bg-stone-50"
                        >
                          {t.general.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => onActionConfirm(customer.id, confirming.targetStatus)}
                          className={`rounded px-2 py-1 text-xs font-medium text-white transition-colors ${
                            confirming.targetStatus === "approved"
                              ? "bg-sage hover:bg-sage/90"
                              : "bg-clay-deep hover:bg-clay-deep/90"
                          }`}
                        >
                          {t.general.confirm}
                        </button>
                      </div>
                    </div>
                  )}

                  {isUpdating && (
                    <span className="text-xs text-ink-soft">{t.general.loading}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
