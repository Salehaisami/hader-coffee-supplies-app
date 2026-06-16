import Foundation

/// Maps order status to a 3-step progress tracker:
/// Step 0: Pending → Step 1: Sent to Supplier → Step 2: Delivered
///
/// Cancelled orders show step 0 (pending) frozen — the tracker doesn't advance.
enum OrderTracker {
    /// The tracker steps in display order.
    static let steps: [OrderStatus] = [.pending, .sentToSupplier, .delivered]

    /// Zero-based index of the current step for the given status.
    /// Returns 0 for pending/cancelled, 1 for sentToSupplier, 2 for delivered.
    static func currentStep(for status: OrderStatus) -> Int {
        switch status {
        case .pending, .cancelled: return 0
        case .sentToSupplier: return 1
        case .delivered: return 2
        }
    }

    /// Label for each step.
    static func label(for step: Int) -> String {
        switch step {
        case 0: return L10n.statusPending
        case 1: return L10n.statusSent
        case 2: return L10n.statusDelivered
        default: return ""
        }
    }
}
