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
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const snap = await getDoc(doc(db, "config", "notifications"));
      if (snap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as NotificationsConfig);
      }
    } catch (err) {
      console.error("Failed to load notifications config:", err);
    }
    setLoading(false);
  }

  async function handleToggle(key: keyof NotificationsConfig) {
    setSavingKey(key);
    const newValue = !config[key];
    // Optimistically update UI
    setConfig((prev) => ({ ...prev, [key]: newValue }));
    try {
      await setDoc(doc(db, "config", "notifications"), { [key]: newValue }, { merge: true });
    } catch (err) {
      // Revert on failure
      setConfig((prev) => ({ ...prev, [key]: !newValue }));
      console.error("Failed to update notification setting:", err);
    }
    setSavingKey(null);
  }

  return (
    <div>
      <PageHeader
        title={isAr ? "الإشعارات" : "Notifications"}
        description={isAr ? "إعدادات إشعارات الطلبات والتنبيهات" : "Order notifications and alert preferences"}
      />
      <div className="mx-auto max-w-2xl p-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
            {NOTIFICATION_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{isAr ? item.labelAr : item.labelEn}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{isAr ? item.descriptionAr : item.descriptionEn}</p>
                </div>
                <div className="shrink-0 ms-4">
                  <input
                    type="checkbox"
                    checked={config[item.key]}
                    onChange={() => handleToggle(item.key)}
                    disabled={savingKey === item.key}
                    className="sr-only peer"
                  />
                  <div
                    onClick={() => handleToggle(item.key)}
                    className={`
                      relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ease-in-out
                      ${config[item.key] ? "bg-[#34C759]" : "bg-[#E9E9EA]"}
                      ${savingKey === item.key ? "opacity-50" : ""}
                    `}
                  >
                    <div
                      className={`
                        absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-md
                        transition-transform duration-200 ease-in-out
                        ${config[item.key] ? "translate-x-[22px]" : "translate-x-[2px]"}
                      `}
                    />
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
