import Testing
import Foundation
@testable import CoffeeSuppliesApp

@Suite("Order Model Tests")
struct OrderModelTests {

    @Test("Order line totals are correct")
    func lineItemTotals() {
        let order = TestData.sampleOrder
        #expect(order.items[0].lineTotal == 240) // 48 * 5
        #expect(order.items[1].lineTotal == 170) // 85 * 2
    }

    @Test("Order subtotal sums line totals")
    func orderSubtotal() {
        let order = TestData.sampleOrder
        #expect(order.subtotal == 410) // 240 + 170
    }

    @Test("Order item count sums quantities")
    func orderItemCount() {
        let order = TestData.sampleOrder
        #expect(order.itemCount == 7) // 5 + 2
    }

    @Test("Google Maps URL is constructed correctly from coordinates")
    func googleMapsURL() {
        let order = TestData.sampleOrder
        let expectedURL = "https://www.google.com/maps/search/?api=1&query=21.4858,39.1925"
        #expect(order.googleMapsURL?.absoluteString == expectedURL)
    }

    @Test("Order Codable round-trip preserves snapshots")
    func codableRoundTrip() throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        let data = try encoder.encode(TestData.sampleOrder)
        let decoded = try decoder.decode(Order.self, from: data)

        #expect(decoded.id == TestData.sampleOrder.id)
        #expect(decoded.items.count == 2)
        #expect(decoded.items[0].variantLabel == "8oz")
        #expect(decoded.items[1].variantLabel == nil)
        #expect(decoded.paymentMethod == .cashOnDelivery)
        #expect(decoded.paymentStatus == .codUnpaid)
        #expect(decoded.status == .pending)
    }

    @Test("Variant label is captured in line item snapshot")
    func variantLabelSnapshot() {
        let item = TestData.sampleOrder.items[0]
        #expect(item.variantLabel == "8oz")
        #expect(item.name == "Paper Cup (hot)")
    }

    @Test("Simple item has nil variant label")
    func simpleItemNoVariant() {
        let item = TestData.sampleOrder.items[1]
        #expect(item.variantLabel == nil)
    }
}
