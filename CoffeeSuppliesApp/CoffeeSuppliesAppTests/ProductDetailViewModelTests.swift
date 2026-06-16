import XCTest
@testable import CoffeeSuppliesApp

/// Unit tests for ProductDetailViewModel:
/// variant selection → price/stock derivation, simple-item handling, made-to-order, add-to-cart payload.
@MainActor
final class ProductDetailViewModelTests: XCTestCase {

    // MARK: - Variant Products

    func testInit_VariantProduct_DefaultsToFirstInStockVariant() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)

        // First in-stock variant is 4oz (16oz is out of stock but it's last anyway)
        XCTAssertEqual(sut.selectedVariantId, "4oz")
        XCTAssertTrue(sut.showVariantSelector)
    }

    func testSelectVariant_UpdatesPriceLive() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)

        sut.selectVariant("12oz")
        XCTAssertEqual(sut.currentPrice, 55)

        sut.selectVariant("8oz")
        XCTAssertEqual(sut.currentPrice, 48)
    }

    func testSelectVariant_UpdatesAvailabilityLive() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)

        // 8oz is in stock
        sut.selectVariant("8oz")
        XCTAssertTrue(sut.isAvailable)
        XCTAssertTrue(sut.canAddToCart)

        // 16oz is out of stock
        sut.selectVariant("16oz")
        XCTAssertFalse(sut.isAvailable)
        XCTAssertFalse(sut.canAddToCart)
    }

    func testSelectVariant_UpdatesPricingUnitLabel() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)

        sut.selectVariant("4oz")
        XCTAssertFalse(sut.currentPricingUnitLabel.isEmpty)
    }

    // MARK: - Simple Products (no variants)

    func testInit_SimpleProduct_NoVariantSelector() {
        let sut = ProductDetailViewModel(product: TestData.customPrintedCup)

        XCTAssertFalse(sut.showVariantSelector)
        XCTAssertNil(sut.selectedVariantId)
        XCTAssertNil(sut.selectedVariant)
    }

    func testSimpleProduct_UsesBasePrice() {
        let sut = ProductDetailViewModel(product: TestData.customPrintedCup)

        XCTAssertEqual(sut.currentPrice, 450)
        // PricingUnit.caseOf50.shortLabel — language-dependent, just assert non-empty
        XCTAssertFalse(sut.currentPricingUnitLabel.isEmpty)
    }

    func testSimpleProduct_UsesBaseStock() {
        let inStock = ProductDetailViewModel(product: TestData.customPrintedCup)
        XCTAssertTrue(inStock.isAvailable)

        let outOfStock = ProductDetailViewModel(product: TestData.napkin)
        XCTAssertFalse(outOfStock.isAvailable)
        XCTAssertFalse(outOfStock.canAddToCart)
    }

    // MARK: - Delivery & Made-to-Order

    func testDeliveryEstimate_ComesFromProduct() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)
        XCTAssertEqual(sut.deliveryEstimate, "\u{2068}2–4\u{2069} days")
    }

    func testMadeToOrder_FlagReflectsProduct() {
        XCTAssertTrue(ProductDetailViewModel(product: TestData.customPrintedCup).isMadeToOrder)
        XCTAssertFalse(ProductDetailViewModel(product: TestData.paperCupHot).isMadeToOrder)
    }

    // MARK: - Add to Cart

    func testAddToCart_VariantProduct_BuildsCorrectItem() {
        var captured: CartItem?
        let sut = ProductDetailViewModel(product: TestData.paperCupHot) { item in
            captured = item
        }

        sut.selectVariant("12oz")
        sut.quantity = 3
        sut.addToCart()

        XCTAssertEqual(captured?.productId, TestData.paperCupHot.id)
        XCTAssertEqual(captured?.variantId, "12oz")
        // variantLabel is the localized label which depends on shared language state —
        // assert it's non-nil (content tested by variant model tests).
        XCTAssertNotNil(captured?.variantLabel)
        XCTAssertEqual(captured?.unitPrice, 55)
        XCTAssertEqual(captured?.quantity, 3)
        XCTAssertEqual(captured?.lineTotal, 165) // 55 * 3
    }

    func testAddToCart_SimpleProduct_NoVariantLabel() {
        var captured: CartItem?
        let sut = ProductDetailViewModel(product: TestData.customPrintedCup) { item in
            captured = item
        }

        sut.quantity = 2
        sut.addToCart()

        XCTAssertEqual(captured?.productId, TestData.customPrintedCup.id)
        XCTAssertNil(captured?.variantId)
        XCTAssertNil(captured?.variantLabel)
        XCTAssertEqual(captured?.unitPrice, 450)
        XCTAssertEqual(captured?.lineTotal, 900) // 450 * 2
    }

    func testAddToCart_OutOfStock_DoesNotInvokeCallback() {
        var captured: CartItem?
        let sut = ProductDetailViewModel(product: TestData.napkin) { item in
            captured = item
        }

        sut.addToCart()

        XCTAssertNil(captured)
    }

    func testAddToCart_OutOfStockVariant_DoesNotInvokeCallback() {
        var callCount = 0
        let sut = ProductDetailViewModel(product: TestData.paperCupHot) { _ in
            callCount += 1
        }

        sut.selectVariant("16oz") // out of stock
        sut.addToCart()

        XCTAssertEqual(callCount, 0)
    }

    // MARK: - Quantity

    func testQuantity_DefaultsToOne() {
        let sut = ProductDetailViewModel(product: TestData.paperCupHot)
        XCTAssertEqual(sut.quantity, 1)
    }
}
