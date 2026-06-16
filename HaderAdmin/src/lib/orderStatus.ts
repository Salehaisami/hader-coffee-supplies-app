import { type OrderStatus } from "./types";

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
export function getStatusActionLabel(nextStatus: OrderStatus): string {
  switch (nextStatus) {
    case "sent_to_supplier":
      return "Mark Sent to Supplier";
    case "delivered":
      return "Mark Delivered";
    default:
      return `Mark ${nextStatus}`;
  }
}

/** Confirmation prompt text for advancing to a given status. */
export function getStatusConfirmMessage(nextStatus: OrderStatus): string {
  switch (nextStatus) {
    case "sent_to_supplier":
      return "Are you sure you want to mark this order as Sent to Supplier?";
    case "delivered":
      return "Are you sure you want to mark this order as Delivered?";
    default:
      return `Are you sure you want to change the status to ${nextStatus}?`;
  }
}
