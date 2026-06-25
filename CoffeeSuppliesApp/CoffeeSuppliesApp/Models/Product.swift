import Foundation

/// Variant within a product (e.g., different cup sizes).
struct ProductVariant: Codable, Equatable, Identifiable {
    let variantId: String
    let labelAr: String
    let labelEn: String
    let sellPrice: Double
    let pricingUnit: String
    let pricingUnitLabelAr: String?
    let pricingUnitLabelEn: String?
    let inStock: Bool
    let costPrice: Double?

    var id: String { variantId }

    /// Resolved label based on current language.
    var localizedLabel: String {
        LanguageManager.shared.resolve(ar: labelAr, en: labelEn)
    }

    /// Localized pricing unit label from denormalized Firestore fields.
    var localizedPricingUnitLabel: String {
        let label = LanguageManager.shared.resolve(
            ar: pricingUnitLabelAr ?? "",
            en: pricingUnitLabelEn ?? ""
        )
        return label.isEmpty ? pricingUnit : label
    }

    enum CodingKeys: String, CodingKey {
        case variantId
        case labelAr = "label_ar"
        case labelEn = "label_en"
        case sellPrice
        case pricingUnit
        case pricingUnitLabelAr = "pricingUnitLabel_ar"
        case pricingUnitLabelEn = "pricingUnitLabel_en"
        case inStock
        case costPrice
    }
}

/// Supplier reference within a product.
struct ProductSupplier: Codable, Equatable {
    let supplierId: String
    let costPrice: Double?
    let sellPrice: Double
    let pricingUnit: String
    let deliveryEstimate: DeliveryEstimate
}

/// Time unit for delivery estimates.
enum DeliveryUnit: String, Codable, CaseIterable {
    case hours
    case days
    case weeks
    case months

    /// Localized label for the unit (plural form used with numbers).
    var localizedLabel: String {
        switch self {
        case .hours: return LanguageManager.shared.resolve(ar: "ساعات", en: "hours")
        case .days: return LanguageManager.shared.resolve(ar: "أيام", en: "days")
        case .weeks: return LanguageManager.shared.resolve(ar: "أسابيع", en: "weeks")
        case .months: return LanguageManager.shared.resolve(ar: "أشهر", en: "months")
        }
    }
}

/// Structured delivery estimate: min–max range + unit.
/// Renders a fully localized string without mixing languages.
struct DeliveryEstimate: Codable, Equatable {
    let minValue: Int
    let maxValue: Int
    let unit: DeliveryUnit

    /// Localized display string: "2–4 أيام" (ar) or "2–4 days" (en)
    /// Uses Unicode First Strong Isolate (FSI) to prevent BiDi reordering of the numeric range.
    var localizedString: String {
        if minValue == maxValue {
            return "\u{2068}\(minValue)\u{2069} \(unit.localizedLabel)"
        }
        return "\u{2068}\(minValue)–\(maxValue)\u{2069} \(unit.localizedLabel)"
    }
}

/// Product document model matching Firestore schema.
/// Single base schema for all items — variants are optional.
struct Product: Codable, Identifiable, Equatable {
    let id: String
    let nameAr: String
    let nameEn: String
    let descriptionAr: String
    let descriptionEn: String
    let imageUrl: String?
    let categoryId: String
    /// Raw pricing unit key (e.g. "dozen", "case_of_50"). Kept for Firestore schema alignment
    /// and potential future use (filtering/grouping by unit). Display uses the label fields below.
    let pricingUnit: String
    /// Denormalized display labels written by the admin dashboard at save time.
    /// Preferred for display; falls back to `pricingUnit` raw string for older products.
    let pricingUnitLabelAr: String?
    let pricingUnitLabelEn: String?
    let hasVariants: Bool
    let sellPrice: Double
    let deliveryEstimate: DeliveryEstimate
    let inStock: Bool
    let madeToOrder: Bool
    let activeSupplierIndex: Int
    let suppliers: [ProductSupplier]
    let variants: [ProductVariant]
    let createdAt: Date?
    let updatedAt: Date?

    /// Resolved name based on current language.
    var localizedName: String {
        LanguageManager.shared.resolve(ar: nameAr, en: nameEn)
    }

    /// Resolved description based on current language.
    var localizedDescription: String {
        LanguageManager.shared.resolve(ar: descriptionAr, en: descriptionEn)
    }

    /// Localized pricing unit label — prefers denormalized Firestore labels,
    /// falls back to the raw pricingUnit string for older products.
    var localizedPricingUnitLabel: String {
        let label = LanguageManager.shared.resolve(
            ar: pricingUnitLabelAr ?? "",
            en: pricingUnitLabelEn ?? ""
        )
        return label.isEmpty ? pricingUnit : label
    }

    /// Display price: lowest variant price if has variants, otherwise base price.
    var displayPrice: Double {
        if hasVariants, let lowest = variants.map(\.sellPrice).min() {
            return lowest
        }
        return sellPrice
    }

    /// Whether the product (or any variant) is available.
    var isAvailable: Bool {
        if hasVariants {
            return variants.contains(where: \.inStock)
        }
        return inStock
    }

    /// The default variant to preselect: first in-stock variant, falling back to the first variant.
    /// Returns nil for simple (non-variant) products.
    var defaultVariant: ProductVariant? {
        guard hasVariants else { return nil }
        return variants.first(where: \.inStock) ?? variants.first
    }

    /// The active supplier for Phase One (single supplier per item).
    var activeSupplier: ProductSupplier? {
        guard suppliers.indices.contains(activeSupplierIndex) else { return nil }
        return suppliers[activeSupplierIndex]
    }

    enum CodingKeys: String, CodingKey {
        case id
        case nameAr = "name_ar"
        case nameEn = "name_en"
        case descriptionAr = "description_ar"
        case descriptionEn = "description_en"
        case imageUrl
        case categoryId
        case pricingUnit
        case pricingUnitLabelAr = "pricingUnitLabel_ar"
        case pricingUnitLabelEn = "pricingUnitLabel_en"
        case hasVariants
        case sellPrice
        case deliveryEstimate
        case inStock
        case madeToOrder
        case activeSupplierIndex
        case suppliers
        case variants
        case createdAt
        case updatedAt
    }
}
