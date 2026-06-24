"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type OrderStatus } from "@/lib/types";
import {
  getNextStatus,
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
  const [confirming, setConfirming] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  const nextStatus = getNextStatus(currentStatus);

  // Nothing to render for terminal states.
  if (!nextStatus) return null;

  const label = getStatusActionLabel(nextStatus, t);
  const confirmMessage = getStatusConfirmMessage(nextStatus, t);

  async function handleConfirm() {
    setUpdating(true);
    setError(null);

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      // Success — the real-time listener will update the UI automatically.
      setConfirming(false);
    } catch (err) {
      console.error("Failed to update order status:", err);
      setError(t.statusActions.updateFailed);
    } finally {
      setUpdating(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm text-ink" data-testid="confirm-message">
          {confirmMessage}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={updating}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stone-50 disabled:opacity-50"
            data-testid="cancel-status-update"
          >
            {t.general.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={updating}
            className="rounded-md bg-clay px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-clay-deep disabled:opacity-50"
            data-testid="confirm-status-update"
          >
            {updating ? t.statusActions.updating : t.general.confirm}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600" data-testid="status-update-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/90"
        data-testid="advance-status-btn"
      >
        {label}
      </button>
      {error && (
        <p className="text-xs text-red-600" data-testid="status-update-error">
          {error}
        </p>
      )}
    </div>
  );
}
