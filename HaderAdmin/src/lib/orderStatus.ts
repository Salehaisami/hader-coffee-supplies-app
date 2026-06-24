import { type OrderStatus } from "./types";
import { type TranslationDictionary } from "./i18n/types";

/**
 * Returns the next valid status in the order lifecycle, or null if the
 * current status is terminal (delivered / cancelled).
 *
 * Valid flow: pending → sent_to_supplier → delivered
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  switch (currentStatus) {
    case "pending":
      return "sent_to_supplier";
    case "sent_to_supplier":
      return "delivered";
    case "delivered":
    case "cancelled":
      return null;
    default:
      return null;
  }
}

/** Human-readable label for a status transition button. */
export function getStatusActionLabel(nextStatus: OrderStatus, t: TranslationDictionary): string {
  switch (nextStatus) {
    case "sent_to_supplier":
      return t.statusActions.markSentToSupplier;
    case "delivered":
      return t.statusActions.markDelivered;
    default:
      return t.orders.status[nextStatus] ?? nextStatus;
  }
}

/** Confirmation prompt text for advancing to a given status. */
export function getStatusConfirmMessage(nextStatus: OrderStatus, t: TranslationDictionary): string {
  switch (nextStatus) {
    case "sent_to_supplier":
      return t.statusActions.confirmSentToSupplier;
    case "delivered":
      return t.statusActions.confirmDelivered;
    default:
      return t.orders.confirmStatusChange;
  }
}
