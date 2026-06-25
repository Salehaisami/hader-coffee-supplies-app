"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface SettingsItem {
  href: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  enabled: boolean;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/settings/pricing-units",
    labelAr: "وحدات التسعير",
    labelEn: "Pricing Units",
    descriptionAr: "إدارة وحدات قياس المنتجات (علبة، دزينة، كيلو...)",
    descriptionEn: "Manage product measurement units (pack, dozen, kg...)",
    enabled: true,
  },
  {
    href: "/settings/delivery-zones",
    labelAr: "مناطق التوصيل",
    labelEn: "Delivery Zones",
    descriptionAr: "تحديد مناطق التوصيل المتاحة ورسوم التوصيل",
    descriptionEn: "Configure available delivery areas and fees",
    enabled: false,
  },
  {
    href: "/settings/payment-methods",
    labelAr: "طرق الدفع",
    labelEn: "Payment Methods",
    descriptionAr: "إدارة طرق الدفع المتاحة للعملاء",
    descriptionEn: "Manage available payment methods for customers",
    enabled: false,
  },
  {
    href: "/settings/notifications",
    labelAr: "الإشعارات",
    labelEn: "Notifications",
    descriptionAr: "إعدادات إشعارات الطلبات والتنبيهات",
    descriptionEn: "Order notifications and alert preferences",
    enabled: false,
  },
];

export default function SettingsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div>
      <PageHeader
        title={isAr ? "الإعدادات" : "Settings"}
        description={isAr ? "إدارة إعدادات النظام" : "Manage system configuration"}
      />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SETTINGS_ITEMS.map((item) => {
            const content = (
              <div
                className={`rounded-lg border p-5 transition-colors ${
                  item.enabled
                    ? "border-stone-200 bg-white hover:border-clay/40 hover:shadow-sm cursor-pointer"
                    : "border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${item.enabled ? "text-ink" : "text-ink-soft"}`}>
                    {isAr ? item.labelAr : item.labelEn}
                  </h3>
                  {!item.enabled && (
                    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                      {isAr ? "قريباً" : "Soon"}
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-xs ${item.enabled ? "text-ink-soft" : "text-stone-400"}`}>
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </p>
              </div>
            );

            if (item.enabled) {
              return (
                <Link key={item.href} href={item.href}>
                  {content}
                </Link>
              );
            }

            return <div key={item.href}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
