import Foundation
import Observation

/// ViewModel for the Orders tab.
/// Loads the customer's orders from Firestore and splits them into active/past.
@MainActor
@Observable
final class OrdersViewModel {
    // MARK: - State

    var orders: [Order] = []
    var isLoading: Bool = false
    var errorMessage: String?

    // MARK: - Dependencies

    @ObservationIgnored private let firestoreService: FirestoreServiceProtocol
    @ObservationIgnored private let customerId: String?

    // MARK: - Init

    init(firestoreService: FirestoreServiceProtocol, customerId: String?) {
        self.firestoreService = firestoreService
        self.customerId = customerId
    }

    // MARK: - Actions

    func loadOrders() async {
        guard let customerId, !customerId.isEmpty else {
            orders = []
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            let fetched: [Order] = try await firestoreService.getDocuments(
                collection: "orders",
                whereField: "customerId",
                isEqualTo: customerId
            )
            orders = fetched.sorted { $0.createdAt > $1.createdAt }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func cancelOrder(_ order: Order) async {
        guard order.status == .pending else { return }
        do {
            try await firestoreService.updateDocument(
                collection: "orders",
                documentId: order.id,
                fields: ["status": OrderStatus.cancelled.rawValue, "updatedAt": Date()]
            )
            // Update local state
            if let index = orders.firstIndex(where: { $0.id == order.id }) {
                // Reconstruct with new status (Order is a value type)
                let cancelled = Order(
                    id: order.id, customerId: order.customerId, businessName: order.businessName,
                    deliveryAddress: order.deliveryAddress, items: order.items, subtotal: order.subtotal,
                    total: order.total, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
                    status: .cancelled, supplierId: order.supplierId, createdAt: order.createdAt, updatedAt: Date()
                )
                orders[index] = cancelled
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Derived

    var activeOrders: [Order] {
        orders.filter { $0.status == .pending || $0.status == .sentToSupplier }
    }

    var pastOrders: [Order] {
        orders.filter { $0.status == .delivered || $0.status == .cancelled }
    }

    var isEmpty: Bool {
        !isLoading && orders.isEmpty && errorMessage == nil
    }
}
