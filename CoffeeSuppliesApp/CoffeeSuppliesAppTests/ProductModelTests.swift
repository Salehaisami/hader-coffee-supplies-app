import Testing
import Foundation
@testable import CoffeeSuppliesApp

@Suite("Product Model Tests")
struct ProductModelTests {

    @Test("Display price uses lowest variant price for variant items")
    func displayPriceVariantItem() {
        let product = TestData.paperCupHot
        #expect(product.hasVariants == true)
        #expect(product.displayPrice == 35) // 4oz is the cheapest at 35
    }

    @Test("Display price uses base price for simple items")
    func displayPriceSimpleItem() {
        let product = TestData.customPrintedCup
        #expect(product.hasVariants == false)
        #expect(product.displayPrice == 450)
    }

    @Test("isAvailable true when any variant is in stock")
    func isAvailableVariantItem() {
        let product = TestData.paperCupHot
        #expect(product.isAvailable == true)
    }

    @Test("isAvailable reflects base inStock for simple items")
    func isAvailableSimpleItem() {
        #expect(TestData.customPrintedCup.isAvailable == true)
        #expect(TestData.napkin.isAvailable == false)
    }

    @Test("Product Codable round-trip preserves all fields")
    func codableRoundTrip() throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        let data = try encoder.encode(TestData.paperCupHot)
        let decoded = try decoder.decode(Product.self, from: data)

        #expect(decoded.id == TestData.paperCupHot.id)
        #expect(decoded.nameAr == TestData.paperCupHot.nameAr)
        #expect(decoded.nameEn == TestData.paperCupHot.nameEn)
        #expect(decoded.hasVariants == true)
        #expect(decoded.variants.count == 4)
        #expect(decoded.suppliers.count == 1)
        #expect(decoded.madeToOrder == false)
    }

    @Test("Variant Codable preserves cost price")
    func variantCodable() throws {
        let variant = TestData.paperCupHot.variants[0]
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()

        let data = try encoder.encode(variant)
        let decoded = try decoder.decode(ProductVariant.self, from: data)

        #expect(decoded.variantId == "4oz")
        #expect(decoded.sellPrice == 35)
        #expect(decoded.costPrice == 22)
        #expect(decoded.inStock == true)
    }

    @Test("Made-to-order flag is correctly set")
    func madeToOrderFlag() {
        #expect(TestData.customPrintedCup.madeToOrder == true)
        #expect(TestData.paperCupHot.madeToOrder == false)
    }
}
