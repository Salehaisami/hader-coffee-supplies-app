"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface DeliveryEstimatesConfig {
  defaultMin: number;
  defaultMax: number;
  defaultUnit: string;
  units: string[];
}

const DEFAULT_CONFIG: DeliveryEstimatesConfig = {
  defaultMin: 2,
  defaultMax: 4,
  defaultUnit: "days",
  units: ["hours", "days", "weeks", "months"],
};

export default function DeliveryEstimatesPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [config, setConfig] = useState<DeliveryEstimatesConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, "config", "deliveryEstimates"));
      if (snap.exists()) {
        setConfig(snap.data() as DeliveryEstimatesConfig);
      }
    } catch (err) {
      console.error("Failed to load delivery estimates:", err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "config", "deliveryEstimates"), config, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save delivery estimates:", err);
    }
    setSaving(false);
  }

  const unitLabels: Record<string, { ar: string; en: string }> = {
    hours: { ar: "ساعات", en: "Hours" },
    days: { ar: "أيام", en: "Days" },
    weeks: { ar: "أسابيع", en: "Weeks" },
    months: { ar: "أشهر", en: "Months" },
  };

  const labels = {
    title: isAr ? "مدة التوصيل" : "Delivery Estimates",
    description: isAr ? "تعيين مدة التوصيل الافتراضية للمنتجات" : "Set default delivery time estimates for products",
    min: isAr ? "الحد الأدنى" : "Minimum",
    max: isAr ? "الحد الأقصى" : "Maximum",
    unit: isAr ? "الوحدة" : "Unit",
    save: isAr ? "حفظ" : "Save",
    saved: isAr ? "تم الحفظ" : "Saved",
    loading: isAr ? "جاري التحميل..." : "Loading...",
    note: isAr ? "المنتجات يمكنها تجاوز هذه القيم بمدة توصيل خاصة لكل منتج." : "Products can override this with a per-product delivery estimate.",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-xl p-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.min}</label>
                <input
                  type="number"
                  min="1"
                  value={config.defaultMin}
                  onChange={(e) => setConfig((p) => ({ ...p, defaultMin: parseInt(e.target.value) || 1 }))}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.max}</label>
                <input
                  type="number"
                  min="1"
                  value={config.defaultMax}
                  onChange={(e) => setConfig((p) => ({ ...p, defaultMax: parseInt(e.target.value) || 1 }))}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.unit}</label>
              <select
                value={config.defaultUnit}
                onChange={(e) => setConfig((p) => ({ ...p, defaultUnit: e.target.value }))}
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
              >
                {config.units.map((u) => (
                  <option key={u} value={u}>{isAr ? unitLabels[u]?.ar : unitLabels[u]?.en}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-ink-soft">{labels.note}</p>

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep disabled:opacity-50"
            >
              {saving ? "..." : saved ? labels.saved + " ✓" : labels.save}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
