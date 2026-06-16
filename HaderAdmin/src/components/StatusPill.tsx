"use client";

import { type OrderStatus } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

/**
 * Tailwind classes per status, drawn from the Stone/Ink/Clay/Sage tokens:
 * - pending: Clay (needs attention)
 * - sent_to_supplier: Stone (in progress)
 * - delivered: Sage (positive/complete)
 * - cancelled: muted Stone (inactive)
 */
const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-clay/10 text-clay-deep",
  sent_to_supplier: "bg-stone-200 text-stone-800",
  delivered: "bg-sage/15 text-sage",
  cancelled: "bg-stone-100 text-stone-400 line-through",
};

/**
 * A small color-coded pill for displaying an order's status. Reused across
 * the orders list and order detail views. Renders the localized status label.
 */
export default function StatusPill({ status }: { status: OrderStatus }) {
  const { t } = useLocale();
  const label = t.orders.status[status] ?? status;
  const classes = STATUS_CLASSES[status] ?? "bg-stone-100 text-stone-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
