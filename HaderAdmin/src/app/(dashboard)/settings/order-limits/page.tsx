"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface OrderLimitsConfig {
  minimumOrderAmount: number;
  maximumOrderAmount: number;
}

const DEFAULT_CONFIG: OrderLimitsConfig = {
  minimumOrderAmount: 0,
  maximumOrderAmount: 0,
};

export default function OrderLimitsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [config, setConfig] = useState<OrderLimitsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, "config", "orderLimits"));
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as OrderLimitsConfig);
      }
    } catch (err) {
      console.error("Failed to load order limits:", err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "config", "orderLimits"), config, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save order limits:", err);
    }
    setSaving(false);
  }

  const labels = {
    title: isAr ? "حدود الطلبات" : "Order Limits",
    description: isAr ? "تحديد الحد الأدنى والأقصى لقيمة الطلب" : "Set minimum and maximum order amounts",
    min: isAr ? "الحد الأدنى (ر.س)" : "Minimum (SAR)",
    max: isAr ? "الحد الأقصى (ر.س)" : "Maximum (SAR)",
    minHint: isAr ? "اتركه 0 لعدم وجود حد أدنى" : "Set to 0 for no minimum",
    maxHint: isAr ? "اتركه 0 لعدم وجود حد أقصى" : "Set to 0 for no maximum",
    save: isAr ? "حفظ" : "Save",
    saved: isAr ? "تم الحفظ" : "Saved",
    loading: isAr ? "جاري التحميل..." : "Loading...",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-xl p-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{labels.min}</label>
              <input
                type="number"
                min="0"
                step="1"
                value={config.minimumOrderAmount}
                onChange={(e) => setConfig((p) => ({ ...p, minimumOrderAmount: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                dir="ltr"
              />
              <p className="mt-1 text-xs text-ink-soft">{labels.minHint}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{labels.max}</label>
              <input
                type="number"
                min="0"
                step="1"
                value={config.maximumOrderAmount}
                onChange={(e) => setConfig((p) => ({ ...p, maximumOrderAmount: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
                dir="ltr"
              />
              <p className="mt-1 text-xs text-ink-soft">{labels.maxHint}</p>
            </div>

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
