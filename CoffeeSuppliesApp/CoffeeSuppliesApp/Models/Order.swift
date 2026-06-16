import Foundation

/// Payment status for orders.
enum PaymentStatus: String, Codable {
    case paid
    case pending
    case codUnpaid = "cod_unpaid"
}

/// Snapshot of a line item at purchase time.
struct OrderLineItem: Codable, Equatable, Identifiable {
    let productId: String
    let name: String
    let variantLabel: String?
    let pricingUnitLabel: String
    let unitPrice: Double
    let costPrice: Double?
    let quantity: Int
    let lineTotal: Double

    var id: String { "\(productId)_\(variantLabel ?? "base")" }
}

/// Order document model matching Firestore schema.
struct Order: Codable, Identifiable, Equatable {
    let id: String
    let customerId: String
    let businessName: String
    let deliveryAddress: DeliveryAddress
    let items: [OrderLineItem]
    let subtotal: Double
    let total: Double
    let paymentMethod: PaymentMethod
    let paymentStatus: PaymentStatus
    let status: OrderStatus
    let supplierId: String?
    let createdAt: Date
    let updatedAt: Date?

    /// Google Maps deep link for driver navigation.
    var googleMapsURL: URL? {
        let lat = deliveryAddress.lat
        let lng = deliveryAddress.lng
        return URL(string: "https://www.google.com/maps/search/?api=1&query=\(lat),\(lng)")
    }

    /// Item count for display.
    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
}
