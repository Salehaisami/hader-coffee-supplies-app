"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface GeneralConfig {
  currency: string;
  currencySymbol_ar: string;
  currencySymbol_en: string;
  countryCode: string;
  appName_ar: string;
  appName_en: string;
  supportPhone: string;
  supportEmail: string;
  adminEmails: string;
}

const DEFAULT_CONFIG: GeneralConfig = {
  currency: "SAR",
  currencySymbol_ar: "ر.س",
  currencySymbol_en: "SAR",
  countryCode: "SA",
  appName_ar: "حاضر",
  appName_en: "Hader",
  supportPhone: "+966500000000",
  supportEmail: "support@hader.sa",
  adminEmails: "",
};

const CURRENCIES = [
  { code: "SAR", labelAr: "ريال سعودي", labelEn: "Saudi Riyal" },
  { code: "AED", labelAr: "درهم إماراتي", labelEn: "UAE Dirham" },
  { code: "KWD", labelAr: "دينار كويتي", labelEn: "Kuwaiti Dinar" },
  { code: "BHD", labelAr: "دينار بحريني", labelEn: "Bahraini Dinar" },
  { code: "QAR", labelAr: "ريال قطري", labelEn: "Qatari Riyal" },
  { code: "OMR", labelAr: "ريال عماني", labelEn: "Omani Rial" },
];

const COUNTRIES = [
  { code: "SA", labelAr: "السعودية", labelEn: "Saudi Arabia" },
  { code: "AE", labelAr: "الإمارات", labelEn: "UAE" },
  { code: "KW", labelAr: "الكويت", labelEn: "Kuwait" },
  { code: "BH", labelAr: "البحرين", labelEn: "Bahrain" },
  { code: "QA", labelAr: "قطر", labelEn: "Qatar" },
  { code: "OM", labelAr: "عمان", labelEn: "Oman" },
];

export default function GeneralSettingsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [config, setConfig] = useState<GeneralConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, "config", "general"));
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as GeneralConfig);
      }
    } catch (err) {
      console.error("Failed to load general config:", err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "config", "general"), config, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save general config:", err);
    }
    setSaving(false);
  }

  const labels = {
    title: isAr ? "إعدادات عامة" : "General",
    description: isAr ? "العملة، اللغة، واسم التطبيق" : "Currency, language, and app display name",
    currency: isAr ? "العملة" : "Currency",
    currencySymbolAr: isAr ? "رمز العملة (عربي)" : "Currency Symbol (Arabic)",
    currencySymbolEn: isAr ? "رمز العملة (إنجليزي)" : "Currency Symbol (English)",
    countryCode: isAr ? "رمز الدولة" : "Country Code",
    appNameAr: isAr ? "اسم التطبيق (عربي)" : "App Name (Arabic)",
    appNameEn: isAr ? "اسم التطبيق (إنجليزي)" : "App Name (English)",
    supportPhone: isAr ? "هاتف الدعم" : "Support Phone",
    supportEmail: isAr ? "بريد الدعم" : "Support Email",
    adminEmails: isAr ? "إيميلات إشعارات الطلبات" : "Order Notification Emails",
    adminEmailsHint: isAr ? "أدخل إيميل واحد أو أكثر (مفصولة بفاصلة) لاستقبال إشعارات الطلبات الجديدة" : "Enter one or more emails (comma-separated) to receive new order notifications",
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.currency}</label>
                <select value={config.currency} onChange={(e) => setConfig((p) => ({ ...p, currency: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {isAr ? c.labelAr : c.labelEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.countryCode}</label>
                <select value={config.countryCode} onChange={(e) => setConfig((p) => ({ ...p, countryCode: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {isAr ? c.labelAr : c.labelEn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.currencySymbolAr}</label>
                <input type="text" value={config.currencySymbol_ar} onChange={(e) => setConfig((p) => ({ ...p, currencySymbol_ar: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.currencySymbolEn}</label>
                <input type="text" value={config.currencySymbol_en} onChange={(e) => setConfig((p) => ({ ...p, currencySymbol_en: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.appNameAr}</label>
                <input type="text" value={config.appName_ar} onChange={(e) => setConfig((p) => ({ ...p, appName_ar: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.appNameEn}</label>
                <input type="text" value={config.appName_en} onChange={(e) => setConfig((p) => ({ ...p, appName_en: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.supportPhone}</label>
              <input type="tel" value={config.supportPhone} onChange={(e) => setConfig((p) => ({ ...p, supportPhone: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" placeholder="+966500000000" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.supportEmail}</label>
              <input type="email" value={config.supportEmail} onChange={(e) => setConfig((p) => ({ ...p, supportEmail: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" placeholder="support@hader.sa" />
            </div>

            <div className="border-t border-stone-100 pt-4">
              <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.adminEmails}</label>
              <input type="text" value={config.adminEmails} onChange={(e) => setConfig((p) => ({ ...p, adminEmails: e.target.value }))} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" placeholder="admin@hader.sa, ops@hader.sa" />
              <p className="mt-1 text-xs text-ink-soft">{labels.adminEmailsHint}</p>
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
