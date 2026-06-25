"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface DeliveryZone {
  id: string;
  label_ar: string;
  label_en: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  enabled: boolean;
}

export default function DeliveryZonesPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    label_ar: "",
    label_en: "",
    lat: "",
    lng: "",
    radiusMeters: "55000",
    enabled: true,
  });

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    try {
      const snap = await getDoc(doc(db, "config", "deliveryZones"));
      if (snap.exists()) {
        setZones(snap.data().zones || []);
      }
    } catch (err) {
      console.error("Failed to load delivery zones:", err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.label_ar.trim() || !formData.label_en.trim()) return;

    setSaving(true);
    const zone: DeliveryZone = {
      id: formData.id || formData.label_en.toLowerCase().replace(/\s+/g, "_"),
      label_ar: formData.label_ar.trim(),
      label_en: formData.label_en.trim(),
      center: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) },
      radiusMeters: parseInt(formData.radiusMeters),
      enabled: formData.enabled,
    };

    let updatedZones: DeliveryZone[];
    if (editingId) {
      updatedZones = zones.map((z) => (z.id === editingId ? zone : z));
    } else {
      updatedZones = [...zones, zone];
    }

    try {
      await setDoc(doc(db, "config", "deliveryZones"), { zones: updatedZones }, { merge: true });
      setZones(updatedZones);
      resetForm();
    } catch (err) {
      console.error("Failed to save delivery zones:", err);
    }
    setSaving(false);
  }

  async function handleToggle(zoneId: string) {
    const updatedZones = zones.map((z) =>
      z.id === zoneId ? { ...z, enabled: !z.enabled } : z
    );
    try {
      await setDoc(doc(db, "config", "deliveryZones"), { zones: updatedZones }, { merge: true });
      setZones(updatedZones);
    } catch (err) {
      console.error("Failed to toggle zone:", err);
    }
  }

  function startEdit(zone: DeliveryZone) {
    setFormData({
      id: zone.id,
      label_ar: zone.label_ar,
      label_en: zone.label_en,
      lat: String(zone.center.lat),
      lng: String(zone.center.lng),
      radiusMeters: String(zone.radiusMeters),
      enabled: zone.enabled,
    });
    setEditingId(zone.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({ id: "", label_ar: "", label_en: "", lat: "", lng: "", radiusMeters: "55000", enabled: true });
    setEditingId(null);
    setShowForm(false);
  }

  const labels = {
    title: isAr ? "مناطق التوصيل" : "Delivery Zones",
    description: isAr ? "تحديد مناطق التوصيل المتاحة ونطاق الجيوفنس" : "Configure delivery area boundaries and geofence radius",
    addNew: isAr ? "إضافة منطقة" : "Add Zone",
    labelAr: isAr ? "الاسم بالعربي" : "Arabic Label",
    labelEn: isAr ? "الاسم بالإنجليزي" : "English Label",
    lat: isAr ? "خط العرض" : "Latitude",
    lng: isAr ? "خط الطول" : "Longitude",
    radius: isAr ? "نصف القطر (م)" : "Radius (m)",
    enabled: isAr ? "مفعّل" : "Enabled",
    save: isAr ? "حفظ" : "Save",
    cancel: isAr ? "إلغاء" : "Cancel",
    edit: isAr ? "تعديل" : "Edit",
    empty: isAr ? "لم يتم إضافة مناطق توصيل بعد" : "No delivery zones added yet",
    loading: isAr ? "جاري التحميل..." : "Loading...",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-4xl p-8">
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mb-6 rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep"
          >
            + {labels.addNew}
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.labelAr}</label>
                <input type="text" value={formData.label_ar} onChange={(e) => setFormData((p) => ({ ...p, label_ar: e.target.value }))} placeholder="جدة" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.labelEn}</label>
                <input type="text" value={formData.label_en} onChange={(e) => setFormData((p) => ({ ...p, label_en: e.target.value }))} placeholder="Jeddah" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.lat}</label>
                <input type="number" step="any" value={formData.lat} onChange={(e) => setFormData((p) => ({ ...p, lat: e.target.value }))} placeholder="21.4858" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.lng}</label>
                <input type="number" step="any" value={formData.lng} onChange={(e) => setFormData((p) => ({ ...p, lng: e.target.value }))} placeholder="39.1925" className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.radius}</label>
                <input type="number" value={formData.radiusMeters} onChange={(e) => setFormData((p) => ({ ...p, radiusMeters: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData((p) => ({ ...p, enabled: e.target.checked }))} className="h-4 w-4 rounded border-stone-300" />
                <label className="text-sm text-ink">{labels.enabled}</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep disabled:opacity-50">{saving ? "..." : labels.save}</button>
              <button type="button" onClick={resetForm} className="rounded-md border border-stone-200 px-4 py-2 text-sm text-ink hover:bg-stone-50">{labels.cancel}</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : zones.length === 0 ? (
          <p className="text-sm text-ink-soft">{labels.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.labelAr}</th>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.labelEn}</th>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.radius}</th>
                  <th className="px-3 py-2.5 font-medium text-center">{labels.enabled}</th>
                  <th className="px-3 py-2.5 font-medium text-end">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-stone-50">
                    <td className="px-3 py-2">{zone.label_ar}</td>
                    <td className="px-3 py-2">{zone.label_en}</td>
                    <td className="px-3 py-2">{(zone.radiusMeters / 1000).toFixed(0)} km</td>
                    <td className="px-3 py-2 text-center">
                      <div
                        onClick={() => handleToggle(zone.id)}
                        className={`relative inline-block w-[51px] h-[31px] rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${zone.enabled ? "bg-[#34C759]" : "bg-[#E9E9EA]"}`}
                      >
                        <div className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${zone.enabled ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-end">
                      <button onClick={() => startEdit(zone)} className="text-xs text-clay hover:underline">{labels.edit}</button>
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
