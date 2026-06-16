import XCTest
@testable import CoffeeSuppliesApp

/// Unit tests for CartStore: add/merge, quantity edits, removal, mixed variants, and totals math.
@MainActor
final class CartStoreTests: XCTestCase {
    private var sut: CartStore!

    override func setUp() {
        super.setUp()
        sut = CartStore()
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }

    // MARK: - Fixtures

    private func cup8oz(qty: Int = 1) -> CartItem {
        CartItem(productId: "cup", name: "Paper Cup", variantId: "8oz", variantLabel: "8oz",
                 unitPrice: 48, pricingUnitLabel: "dozen", quantity: qty)
    }

    private func cup12oz(qty: Int = 1) -> CartItem {
        CartItem(productId: "cup", name: "Paper Cup", variantId: "12oz", variantLabel: "12oz",
                 unitPrice: 55, pricingUnitLabel: "dozen", quantity: qty)
    }

    private func napkin(qty: Int = 1) -> CartItem {
        CartItem(productId: "napkin", name: "Napkin", variantId: nil, variantLabel: nil,
                 unitPrice: 25, pricingUnitLabel: "pack", quantity: qty)
    }

    // MARK: - Initial State

    func testInitialState_IsEmpty() {
        XCTAssertTrue(sut.isEmpty)
        XCTAssertEqual(sut.subtotal, 0)
        XCTAssertEqual(sut.itemCount, 0)
        XCTAssertEqual(sut.lineCount, 0)
    }

    // MARK: - Add

    func testAdd_SingleItem() {
        sut.add(cup8oz(qty: 2))

        XCTAssertFalse(sut.isEmpty)
        XCTAssertEqual(sut.lineCount, 1)
        XCTAssertEqual(sut.itemCount, 2)
        XCTAssertEqual(sut.subtotal, 96) // 48 * 2
    }

    func testAdd_DifferentProducts_CreatesSeparateLines() {
        sut.add(cup8oz(qty: 1))
        sut.add(napkin(qty: 3))

        XCTAssertEqual(sut.lineCount, 2)
        XCTAssertEqual(sut.itemCount, 4) // 1 + 3
        XCTAssertEqual(sut.subtotal, 48 + 75) // 48*1 + 25*3
    }

    func testAdd_SameProductSameVariant_MergesQuantity() {
        sut.add(cup8oz(qty: 2))
        sut.add(cup8oz(qty: 3))

        XCTAssertEqual(sut.lineCount, 1) // merged, not duplicated
        XCTAssertEqual(sut.itemCount, 5)
        XCTAssertEqual(sut.subtotal, 240) // 48 * 5
    }

    func testAdd_SameProductDifferentVariant_CreatesSeparateLines() {
        sut.add(cup8oz(qty: 1))
        sut.add(cup12oz(qty: 1))

        // Same productId but different variant → distinct lines
        XCTAssertEqual(sut.lineCount, 2)
        XCTAssertEqual(sut.subtotal, 48 + 55)
    }

    // MARK: - Update Quantity

    func testUpdateQuantity_ChangesLineTotal() {
        sut.add(cup8oz(qty: 1))
        let id = sut.items[0].id

        sut.updateQuantity(for: id, to: 4)

        XCTAssertEqual(sut.itemCount, 4)
        XCTAssertEqual(sut.subtotal, 192) // 48 * 4
    }

    func testUpdateQuantity_ToZero_RemovesLine() {
        sut.add(cup8oz(qty: 2))
        let id = sut.items[0].id

        sut.updateQuantity(for: id, to: 0)

        XCTAssertTrue(sut.isEmpty)
    }

    func testUpdateQuantity_BelowZero_RemovesLine() {
        sut.add(cup8oz(qty: 2))
        let id = sut.items[0].id

        sut.updateQuantity(for: id, to: -3)

        XCTAssertTrue(sut.isEmpty)
    }

    func testUpdateQuantity_UnknownId_NoOp() {
        sut.add(cup8oz(qty: 2))

        sut.updateQuantity(for: "does-not-exist", to: 10)

        XCTAssertEqual(sut.itemCount, 2)
    }

    // MARK: - Remove

    func testRemove_DeletesLine() {
        sut.add(cup8oz(qty: 1))
        sut.add(napkin(qty: 2))
        let cupId = sut.items[0].id

        sut.remove(id: cupId)

        XCTAssertEqual(sut.lineCount, 1)
        XCTAssertEqual(sut.subtotal, 50) // only napkins: 25 * 2
    }

    func testRemove_UnknownId_NoOp() {
        sut.add(cup8oz(qty: 1))

        sut.remove(id: "nope")

        XCTAssertEqual(sut.lineCount, 1)
    }

    // MARK: - Clear

    func testClear_EmptiesCart() {
        sut.add(cup8oz(qty: 2))
        sut.add(napkin(qty: 1))

        sut.clear()

        XCTAssertTrue(sut.isEmpty)
        XCTAssertEqual(sut.subtotal, 0)
        XCTAssertEqual(sut.itemCount, 0)
    }

    // MARK: - Mixed Cart Math

    func testMixedCart_TotalsAreCorrect() {
        sut.add(cup8oz(qty: 2))   // 96
        sut.add(cup12oz(qty: 1))  // 55
        sut.add(napkin(qty: 4))   // 100

        XCTAssertEqual(sut.lineCount, 3)
        XCTAssertEqual(sut.itemCount, 7) // 2 + 1 + 4
        XCTAssertEqual(sut.subtotal, 251) // 96 + 55 + 100
    }

    // MARK: - CartItem Factory

    func testCartItemFactory_VariantProduct() {
        let item = CartItem(product: TestData.paperCupHot, variant: TestData.paperCupHot.variants[1], quantity: 2)

        XCTAssertEqual(item.productId, TestData.paperCupHot.id)
        XCTAssertEqual(item.variantId, "8oz")
        XCTAssertEqual(item.unitPrice, 48)
        XCTAssertEqual(item.lineTotal, 96)
    }

    func testCartItemFactory_SimpleProduct() {
        let item = CartItem(product: TestData.customPrintedCup, variant: nil, quantity: 1)

        XCTAssertEqual(item.productId, TestData.customPrintedCup.id)
        XCTAssertNil(item.variantId)
        XCTAssertEqual(item.unitPrice, 450)
    }
}
