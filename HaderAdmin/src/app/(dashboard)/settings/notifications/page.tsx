"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface NotificationsConfig {
  orderConfirmation: boolean;
  orderStatusChange: boolean;
  orderCancellation: boolean;
  promotions: boolean;
}

const DEFAULT_CONFIG: NotificationsConfig = {
  orderConfirmation: true,
  orderStatusChange: true,
  orderCancellation: true,
  promotions: false,
};

interface NotificationItem {
  key: keyof NotificationsConfig;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  {
    key: "orderConfirmation",
    labelAr: "تأكيد الطلب",
    labelEn: "Order Confirmation",
    descriptionAr: "إشعار العميل عند تأكيد استلام الطلب",
    descriptionEn: "Notify customer when order is confirmed",
  },
  {
    key: "orderStatusChange",
    labelAr: "تغيير حالة الطلب",
    labelEn: "Order Status Change",
    descriptionAr: "إشعار العميل عند تحديث حالة الطلب",
    descriptionEn: "Notify customer when order status updates",
  },
  {
    key: "orderCancellation",
    labelAr: "إلغاء الطلب",
    labelEn: "Order Cancellation",
    descriptionAr: "إشعار العميل عند إلغاء الطلب",
    descriptionEn: "Notify customer when order is cancelled",
  },
  {
    key: "promotions",
    labelAr: "العروض والتخفيضات",
    labelEn: "Promotions",
    descriptionAr: "إرسال إشعارات ترويجية للعملاء",
    descriptionEn: "Send promotional notifications to customers",
  },
];

export default function NotificationsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [config, setConfig] = useState<NotificationsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, "config", "notifications"));
      if (snap.exists()) {
        setConfig(snap.data() as NotificationsConfig);
      }
    } catch (err) {
      console.error("Failed to load notifications config:", err);
    }
    setLoading(false);
  }

  async function handleToggle(key: keyof NotificationsConfig) {
    setSaving(true);
    const updated = { ...config, [key]: !config[key] };
    try {
      await setDoc(doc(db, "config", "notifications"), updated, { merge: true });
      setConfig(updated);
    } catch (err) {
      console.error("Failed to update notification setting:", err);
    }
    setSaving(false);
  }

  const labels = {
    title: isAr ? "الإشعارات" : "Notifications",
    description: isAr ? "إعدادات إشعارات الطلبات والتنبيهات" : "Order notifications and alert preferences",
    loading: isAr ? "جاري التحميل..." : "Loading...",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-2xl p-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white">
            <div className="divide-y divide-stone-100">
              {NOTIFICATION_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-ink">{isAr ? item.labelAr : item.labelEn}</p>
                    <p className="text-xs text-ink-soft">{isAr ? item.descriptionAr : item.descriptionEn}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${config[item.key] ? "bg-green-500" : "bg-stone-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config[item.key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
