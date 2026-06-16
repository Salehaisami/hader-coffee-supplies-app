import Foundation

#if DEBUG
/// Sample products for SwiftUI previews only.
extension Product {
    static let previewWithVariants = Product(
        id: "preview-cup",
        nameAr: "كوب ورقي (ساخن)",
        nameEn: "Paper Cup (hot)",
        descriptionAr: "أكواب ورقية عالية الجودة للمشروبات الساخنة، مناسبة للاستخدام اليومي في المقهى.",
        descriptionEn: "High-quality paper cups for hot beverages, ideal for daily cafe use.",
        imageUrl: nil,
        categoryId: "cat-cups",
        pricingUnit: .dozen,
        hasVariants: true,
        sellPrice: 48,
        deliveryEstimate: DeliveryEstimate(minValue: 2, maxValue: 4, unit: .days),
        inStock: true,
        madeToOrder: false,
        activeSupplierIndex: 0,
        suppliers: [],
        variants: [
            ProductVariant(variantId: "4oz", labelAr: "4 أونص", labelEn: "4oz", sellPrice: 35, pricingUnit: .dozen, inStock: true, costPrice: 22),
            ProductVariant(variantId: "8oz", labelAr: "8 أونص", labelEn: "8oz", sellPrice: 48, pricingUnit: .dozen, inStock: true, costPrice: 30),
            ProductVariant(variantId: "12oz", labelAr: "12 أونص", labelEn: "12oz", sellPrice: 55, pricingUnit: .dozen, inStock: true, costPrice: 35),
            ProductVariant(variantId: "16oz", labelAr: "16 أونص", labelEn: "16oz", sellPrice: 62, pricingUnit: .dozen, inStock: false, costPrice: 40),
        ],
        createdAt: nil,
        updatedAt: nil
    )

    static let previewMadeToOrder = Product(
        id: "preview-printed",
        nameAr: "كوب مطبوع حسب الطلب",
        nameEn: "Custom Printed Cup",
        descriptionAr: "أكواب مطبوعة بشعار مقهاك، تُصنع حسب الطلب.",
        descriptionEn: "Cups printed with your cafe logo, made to order.",
        imageUrl: nil,
        categoryId: "cat-cups",
        pricingUnit: .caseOf50,
        hasVariants: false,
        sellPrice: 450,
        deliveryEstimate: DeliveryEstimate(minValue: 7, maxValue: 10, unit: .days),
        inStock: true,
        madeToOrder: true,
        activeSupplierIndex: 0,
        suppliers: [],
        variants: [],
        createdAt: nil,
        updatedAt: nil
    )
}
#endif
