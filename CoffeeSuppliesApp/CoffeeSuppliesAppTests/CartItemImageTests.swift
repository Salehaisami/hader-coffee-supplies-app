import XCTest
@testable import CoffeeSuppliesApp

/// Tests that CartItem correctly carries imageUrl from Product.
final class CartItemImageTests: XCTestCase {

    func testCartItemFactory_CarriesImageUrl() {
        let product = Product(
            id: "p1",
            nameAr: "كوب",
            nameEn: "Cup",
            descriptionAr: "وصف",
            descriptionEn: "desc",
            imageUrl: "https://example.com/cup.jpg",
            categoryId: "cat1",
            pricingUnit: "dozen",
            pricingUnitLabelAr: "دزينة",
            pricingUnitLabelEn: "Dozen",
            hasVariants: false,
            sellPrice: 48,
            deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days),
            inStock: true,
            madeToOrder: false,
            activeSupplierIndex: 0,
            suppliers: [],
            variants: [],
            createdAt: nil,
            updatedAt: nil
        )

        let item = CartItem(product: product, variant: nil)

        XCTAssertEqual(item.imageUrl, "https://example.com/cup.jpg")
        XCTAssertEqual(item.productId, "p1")
        XCTAssertEqual(item.unitPrice, 48)
    }

    func testCartItemFactory_NilImageUrl_WhenProductHasNone() {
        let product = Product(
            id: "p2",
            nameAr: "منديل",
            nameEn: "Napkin",
            descriptionAr: "وصف",
            descriptionEn: "desc",
            imageUrl: nil,
            categoryId: "cat2",
            pricingUnit: "pack",
            pricingUnitLabelAr: "عبوة",
            pricingUnitLabelEn: "Pack",
            hasVariants: false,
            sellPrice: 25,
            deliveryEstimate: DeliveryEstimate(minValue: 1, maxValue: 2, unit: .days),
            inStock: true,
            madeToOrder: false,
            activeSupplierIndex: 0,
            suppliers: [],
            variants: [],
            createdAt: nil,
            updatedAt: nil
        )

        let item = CartItem(product: product, variant: nil)

        XCTAssertNil(item.imageUrl)
    }

    func testCartItemExplicitInit_DefaultsImageUrlToNil() {
        let item = CartItem(
            productId: "p3",
            name: "Test",
            variantId: nil,
            variantLabel: nil,
            unitPrice: 10,
            pricingUnitLabel: "piece",
            quantity: 1
        )

        XCTAssertNil(item.imageUrl)
    }

    func testCartItemExplicitInit_AcceptsImageUrl() {
        let item = CartItem(
            productId: "p4",
            name: "Test",
            variantId: nil,
            variantLabel: nil,
            unitPrice: 10,
            pricingUnitLabel: "piece",
            imageUrl: "https://example.com/img.png",
            quantity: 1
        )

        XCTAssertEqual(item.imageUrl, "https://example.com/img.png")
    }
}
