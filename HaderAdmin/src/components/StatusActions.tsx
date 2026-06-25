"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type OrderStatus } from "@/lib/types";
import {
  getNextStatus,
  getPreviousStatus,
  getStatusActionLabel,
  getStatusConfirmMessage,
} from "@/lib/orderStatus";
import { useLocale } from "@/contexts/LocaleContext";

interface StatusActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
}

/**
 * Renders a status-advance button for the current order status, or nothing
 * if the order is in a terminal state. Includes an inline confirmation step
 * before committing the Firestore write.
 */
export default function StatusActions({
  orderId,
  currentStatus,
}: StatusActionsProps) {
  const [confirming, setConfirming] = useState<"advance" | "revert" | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useLocale();

  const nextStatus = getNextStatus(currentStatus);
  const prevStatus = getPreviousStatus(currentStatus);
  const isAr = locale === "ar";

  async function handleStatusChange(newStatus: OrderStatus) {
    setUpdating(true);
    setError(null);

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setConfirming(null);
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError(t.statusActions.updateFailed);
    } finally {
      setUpdating(false);
    }
  }

  // Nothing to render if no actions available
  if (!nextStatus && !prevStatus) return null;

  if (confirming) {
    const targetStatus = confirming === "advance" ? nextStatus! : prevStatus!;
    const message = confirming === "advance"
      ? getStatusConfirmMessage(targetStatus, t)
      : (isAr ? `هل تريد إرجاع الحالة إلى "${t.orders.status[targetStatus]}"؟` : `Revert status to "${t.orders.status[targetStatus]}"?`);

    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm text-ink" data-testid="confirm-message">
          {message}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setConfirming(null); setError(null); }}
            disabled={updating}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stone-50 disabled:opacity-50"
          >
            {t.general.cancel}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange(targetStatus)}
            disabled={updating}
            className="rounded-md bg-clay px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-clay-deep disabled:opacity-50"
          >
            {updating ? t.statusActions.updating : t.general.confirm}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {prevStatus && (
        <button
          type="button"
          onClick={() => setConfirming("revert")}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-stone-50"
        >
          {isAr ? "← تراجع" : "← Revert"}
        </button>
      )}
      {nextStatus && (
        <button
          type="button"
          onClick={() => setConfirming("advance")}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/90"
        >
          {getStatusActionLabel(nextStatus, t)}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
