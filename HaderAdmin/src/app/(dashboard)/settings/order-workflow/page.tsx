"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

interface WorkflowLabels {
  [key: string]: { ar: string; en: string };
}

interface OrderWorkflow {
  steps: string[];
  terminalStatuses: string[];
  labels: WorkflowLabels;
}

const DEFAULT_WORKFLOW: OrderWorkflow = {
  steps: ["pending", "sent_to_supplier", "delivered"],
  terminalStatuses: ["delivered", "cancelled"],
  labels: {
    pending: { ar: "قيد الانتظار", en: "Pending" },
    sent_to_supplier: { ar: "أُرسل للمورد", en: "Sent to Supplier" },
    delivered: { ar: "تم التوصيل", en: "Delivered" },
    cancelled: { ar: "ملغي", en: "Cancelled" },
  },
};

export default function OrderWorkflowPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [workflow, setWorkflow] = useState<OrderWorkflow>(DEFAULT_WORKFLOW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflow();
  }, []);

  async function loadWorkflow() {
    try {
      const snap = await getDoc(doc(db, "config", "orderWorkflow"));
      if (snap.exists()) {
        setWorkflow(snap.data() as OrderWorkflow);
      } else {
        // Save defaults if doc doesn't exist
        await setDoc(doc(db, "config", "orderWorkflow"), DEFAULT_WORKFLOW, { merge: true });
      }
    } catch (err) {
      console.error("Failed to load order workflow:", err);
    }
    setLoading(false);
  }

  const labels = {
    title: isAr ? "مراحل الطلب" : "Order Workflow",
    description: isAr ? "عرض مراحل الطلب والحالات النهائية (للعرض فقط)" : "View order workflow steps and terminal statuses (read-only)",
    step: isAr ? "المرحلة" : "Step",
    arabic: isAr ? "العربي" : "Arabic",
    english: isAr ? "الإنجليزي" : "English",
    terminal: isAr ? "نهائي" : "Terminal",
    loading: isAr ? "جاري التحميل..." : "Loading...",
    readOnly: isAr ? "هذه الصفحة للعرض فقط. تعديل مراحل الطلب سيكون متاحاً في المرحلة القادمة." : "This page is read-only. Editing workflow steps will be available in Phase 2.",
  };

  // Combine steps + terminal-only statuses for display
  const allStatuses = [...workflow.steps, ...workflow.terminalStatuses.filter((s) => !workflow.steps.includes(s))];

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800">{labels.readOnly}</p>
        </div>

        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-start">#</th>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.step}</th>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.arabic}</th>
                  <th className="px-3 py-2.5 font-medium text-start">{labels.english}</th>
                  <th className="px-3 py-2.5 font-medium text-center">{labels.terminal}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allStatuses.map((status, index) => (
                  <tr key={status} className="hover:bg-stone-50">
                    <td className="px-3 py-2 text-ink-soft">{index + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{status}</td>
                    <td className="px-3 py-2" dir="rtl">{workflow.labels[status]?.ar || "—"}</td>
                    <td className="px-3 py-2">{workflow.labels[status]?.en || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {workflow.terminalStatuses.includes(status) && (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          {labels.terminal}
                        </span>
                      )}
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
