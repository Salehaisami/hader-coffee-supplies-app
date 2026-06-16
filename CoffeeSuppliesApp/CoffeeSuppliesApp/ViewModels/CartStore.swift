import Foundation
import Observation

/// Session-scoped shopping cart. Shared across the app via the environment.
/// Holds line items, handles add/merge/remove/quantity edits, and derives totals.
@MainActor
@Observable
final class CartStore {
    // MARK: - State

    private(set) var items: [CartItem] = []

    // MARK: - Mutations

    /// Add an item. If an identical line (same product + variant) already exists,
    /// its quantity is increased instead of adding a duplicate line.
    func add(_ item: CartItem) {
        if let index = items.firstIndex(where: { $0.id == item.id }) {
            items[index].quantity += item.quantity
        } else {
            items.append(item)
        }
    }

    /// Set the quantity for a line. Quantities below 1 remove the line.
    func updateQuantity(for id: String, to quantity: Int) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        if quantity < 1 {
            items.remove(at: index)
        } else {
            items[index].quantity = quantity
        }
    }

    /// Remove a line entirely.
    func remove(id: String) {
        items.removeAll { $0.id == id }
    }

    /// Empty the cart (e.g. after a successful order).
    func clear() {
        items.removeAll()
    }

    // MARK: - Derived

    /// Sum of all line totals.
    var subtotal: Double {
        items.reduce(0) { $0 + $1.lineTotal }
    }

    /// Total number of units across all lines (for the tab badge).
    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    /// Number of distinct lines.
    var lineCount: Int {
        items.count
    }

    var isEmpty: Bool {
        items.isEmpty
    }
}
