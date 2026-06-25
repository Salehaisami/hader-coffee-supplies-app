"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface PaymentMethod {
  id: string;
  label_ar: string;
  label_en: string;
  enabled: boolean;
}

export default function PaymentMethodsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  async function loadMethods() {
    try {
      const snap = await getDoc(doc(db, "config", "paymentMethods"));
      if (snap.exists()) {
        setMethods(snap.data().methods || []);
      } else {
        // Default methods if doc doesn't exist yet
        setMethods([
          { id: "apple_pay", label_ar: "Apple Pay", label_en: "Apple Pay", enabled: true },
          { id: "cash_on_delivery", label_ar: "الدفع عند الاستلام", label_en: "Cash on Delivery", enabled: true },
        ]);
      }
    } catch (err) {
      console.error("Failed to load payment methods:", err);
    }
    setLoading(false);
  }

  async function handleToggle(methodId: string) {
    setSaving(true);
    const updatedMethods = methods.map((m) =>
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    );
    try {
      await setDoc(doc(db, "config", "paymentMethods"), { methods: updatedMethods }, { merge: true });
      setMethods(updatedMethods);
    } catch (err) {
      console.error("Failed to update payment method:", err);
    }
    setSaving(false);
  }

  const labels = {
    title: isAr ? "طرق الدفع" : "Payment Methods",
    description: isAr ? "تفعيل أو تعطيل طرق الدفع المتاحة للعملاء" : "Enable or disable payment methods available to customers",
    method: isAr ? "طريقة الدفع" : "Payment Method",
    status: isAr ? "الحالة" : "Status",
    note: isAr ? "ملاحظة: إضافة طرق دفع جديدة يتطلب تغييرات برمجية." : "Note: Adding new payment methods requires code changes for SDK integration.",
    loading: isAr ? "جاري التحميل..." : "Loading...",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-2xl p-8">
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : (
          <>
            <div className="rounded-lg border border-stone-200 bg-white">
              <div className="divide-y divide-stone-100">
                {methods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{isAr ? method.label_ar : method.label_en}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{isAr ? method.label_en : method.label_ar}</p>
                    </div>
                    <div
                      onClick={() => !saving && handleToggle(method.id)}
                      className={`
                        relative w-[51px] h-[31px] rounded-full transition-colors duration-200 ease-in-out cursor-pointer
                        ${method.enabled ? "bg-[#34C759]" : "bg-[#E9E9EA]"}
                        ${saving ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <div
                        className={`
                          absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-md
                          transition-transform duration-200 ease-in-out
                          ${method.enabled ? "translate-x-[22px]" : "translate-x-[2px]"}
                        `}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft">{labels.note}</p>
          </>
        )}
      </div>
    </div>
  );
}
