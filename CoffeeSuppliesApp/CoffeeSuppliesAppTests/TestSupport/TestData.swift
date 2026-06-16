import Foundation
@testable import CoffeeSuppliesApp

/// Shared test fixtures for reproducible unit tests.
enum TestData {
    // MARK: - Users

    static let sampleUser = AppUser(
        id: "test-uid-001",
        businessName: "مقهى النخبة",
        contactName: "أحمد",
        phone: "+966500000001",
        email: "ahmad@example.com",
        deliveryAddress: sampleAddress,
        role: .customer,
        status: .approved,
        createdAt: Date(timeIntervalSince1970: 1700000000)
    )

    static let pendingUser = AppUser(
        id: "test-uid-002",
        businessName: "كافيه الصباح",
        contactName: "سارة",
        phone: "+966500000002",
        email: nil,
        deliveryAddress: nil,
        role: .customer,
        status: .pending,
        createdAt: Date(timeIntervalSince1970: 1700100000)
    )

    // MARK: - Addresses

    static let sampleAddress = DeliveryAddress(
        city: "Jeddah",
        district: "الروضة",
        street: "شارع الأمير سلطان",
        notes: "المدخل الجانبي",
        lat: 21.5433,
        lng: 39.1728
    )

    // MARK: - Auth

    static let sampleAuthUser = AuthUser(
        uid: "test-uid-001",
        phoneNumber: "+966500000001",
        isNewUser: false
    )

    static let newAuthUser = AuthUser(
        uid: "test-uid-new",
        phoneNumber: "+966500000099",
        isNewUser: true
    )

    // MARK: - Phone Numbers

    static let validPhoneNumber = "500000001"
    static let formattedPhoneNumber = "+966500000001"
    static let verificationId = "mock-verification-id-123"
    static let validOTPCode = "123456"

    /// Alias used by MockFirestoreServiceTests.
    static let customerUser = sampleUser

    // MARK: - Categories

    static let cupsCategory = Category(
        id: "cat-cups",
        nameAr: "أكواب",
        nameEn: "Cups",
        sortOrder: 0,
        iconUrl: nil
    )

    static let suppliesCategory = Category(
        id: "cat-supplies",
        nameAr: "مستلزمات",
        nameEn: "Supplies",
        sortOrder: 1,
        iconUrl: nil
    )

    // MARK: - Products
    /// A product with variants (paper cups in 4 sizes).
    static let paperCupHot = Product(
        id: "product-001",
        nameAr: "كوب ورقي (ساخن)",
        nameEn: "Paper Cup (hot)",
        descriptionAr: "أكواب ورقية للمشروبات الساخنة",
        descriptionEn: "Paper cups for hot beverages",
        imageUrl: "https://example.com/paper-cup.jpg",
        categoryId: "cat-cups",
        pricingUnit: .dozen,
        hasVariants: true,
        sellPrice: 48,
        deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days),
        inStock: true,
        madeToOrder: false,
        activeSupplierIndex: 0,
        suppliers: [
            ProductSupplier(
                supplierId: "supplier-001",
                costPrice: 30,
                sellPrice: 48,
                pricingUnit: .dozen,
                deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days)
            )
        ],
        variants: [
            ProductVariant(variantId: "4oz", labelAr: "4 أونص", labelEn: "4oz", sellPrice: 35, pricingUnit: .dozen, inStock: true, costPrice: 22),
            ProductVariant(variantId: "8oz", labelAr: "8 أونص", labelEn: "8oz", sellPrice: 48, pricingUnit: .dozen, inStock: true, costPrice: 30),
            ProductVariant(variantId: "12oz", labelAr: "12 أونص", labelEn: "12oz", sellPrice: 55, pricingUnit: .dozen, inStock: true, costPrice: 35),
            ProductVariant(variantId: "16oz", labelAr: "16 أونص", labelEn: "16oz", sellPrice: 62, pricingUnit: .dozen, inStock: false, costPrice: 40),
        ],
        createdAt: Date(timeIntervalSince1970: 1700000000),
        updatedAt: nil
    )

    /// A simple product without variants, made-to-order.
    static let customPrintedCup = Product(
        id: "product-002",
        nameAr: "كوب مطبوع حسب الطلب",
        nameEn: "Custom Printed Cup",
        descriptionAr: "أكواب مطبوعة بشعار المقهى",
        descriptionEn: "Cups printed with your cafe logo",
        imageUrl: "https://example.com/custom-cup.jpg",
        categoryId: "cat-cups",
        pricingUnit: .caseOf50,
        hasVariants: false,
        sellPrice: 450,
        deliveryEstimate: DeliveryEstimate(minValue: 7, maxValue: 10, unit: .days),
        inStock: true,
        madeToOrder: true,
        activeSupplierIndex: 0,
        suppliers: [
            ProductSupplier(
                supplierId: "supplier-002",
                costPrice: 300,
                sellPrice: 450,
                pricingUnit: .caseOf50,
                deliveryEstimate: DeliveryEstimate(minValue: 7, maxValue: 10, unit: .days)
            )
        ],
        variants: [],
        createdAt: Date(timeIntervalSince1970: 1700000000),
        updatedAt: nil
    )

    /// A simple product that is out of stock.
    static let napkin = Product(
        id: "product-003",
        nameAr: "مناديل",
        nameEn: "Napkin",
        descriptionAr: "مناديل ورقية",
        descriptionEn: "Paper napkins",
        imageUrl: nil,
        categoryId: "cat-supplies",
        pricingUnit: .pack,
        hasVariants: false,
        sellPrice: 25,
        deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days),
        inStock: false,
        madeToOrder: false,
        activeSupplierIndex: 0,
        suppliers: [
            ProductSupplier(
                supplierId: "supplier-001",
                costPrice: 15,
                sellPrice: 25,
                pricingUnit: .pack,
                deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days)
            )
        ],
        variants: [],
        createdAt: Date(timeIntervalSince1970: 1700000000),
        updatedAt: nil
    )

    // MARK: - Orders

    static let sampleOrder = Order(
        id: "order-001",
        customerId: "test-uid-001",
        businessName: "مقهى النخبة",
        deliveryAddress: DeliveryAddress(
            city: "Jeddah",
            district: "الروضة",
            street: "شارع الأمير سلطان",
            notes: nil,
            lat: 21.4858,
            lng: 39.1925
        ),
        items: [
            OrderLineItem(
                productId: "product-001",
                name: "Paper Cup (hot)",
                variantLabel: "8oz",
                pricingUnitLabel: "per dozen",
                unitPrice: 48,
                costPrice: 30,
                quantity: 5,
                lineTotal: 240
            ),
            OrderLineItem(
                productId: "product-004",
                name: "Coffee Blend",
                variantLabel: nil,
                pricingUnitLabel: "per kg",
                unitPrice: 85,
                costPrice: 55,
                quantity: 2,
                lineTotal: 170
            )
        ],
        subtotal: 410,
        total: 410,
        paymentMethod: .cashOnDelivery,
        paymentStatus: .codUnpaid,
        status: .pending,
        supplierId: "supplier-001",
        createdAt: Date(timeIntervalSince1970: 1700000000),
        updatedAt: nil
    )
}
