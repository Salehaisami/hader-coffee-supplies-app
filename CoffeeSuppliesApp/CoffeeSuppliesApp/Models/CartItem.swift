import Foundation

/// A line item in the shopping cart.
/// Captures a snapshot of the product/variant at the time it was added, so later
/// catalog price changes don't retroactively alter the cart.
struct CartItem: Identifiable, Equatable {
    let productId: String
    let name: String
    let variantId: String?
    let variantLabel: String?
    let unitPrice: Double
    let costPrice: Double?
    let pricingUnitLabel: String
    let imageUrl: String?
    var quantity: Int

    init(
        productId: String,
        name: String,
        variantId: String?,
        variantLabel: String?,
        unitPrice: Double,
        costPrice: Double? = nil,
        pricingUnitLabel: String,
        imageUrl: String? = nil,
        quantity: Int
    ) {
        self.productId = productId
        self.name = name
        self.variantId = variantId
        self.variantLabel = variantLabel
        self.unitPrice = unitPrice
        self.costPrice = costPrice
        self.pricingUnitLabel = pricingUnitLabel
        self.imageUrl = imageUrl
        self.quantity = quantity
    }

    /// Stable identity: a product plus a specific variant is one cart line.
    var id: String {
        "\(productId)_\(variantId ?? "base")"
    }

    /// Line total = unit price × quantity.
    var lineTotal: Double {
        unitPrice * Double(quantity)
    }
}

// MARK: - Factory

extension CartItem {
    /// Build a cart line from a product and an optional chosen variant.
    /// Uses the variant's price/label when present, otherwise the product's base values.
    init(product: Product, variant: ProductVariant?, quantity: Int = 1) {
        self.init(
            productId: product.id,
            name: product.localizedName,
            variantId: variant?.variantId,
            variantLabel: variant?.localizedLabel,
            unitPrice: variant?.sellPrice ?? product.sellPrice,
            costPrice: variant?.costPrice ?? product.activeSupplier?.costPrice,
            pricingUnitLabel: variant?.localizedPricingUnitLabel ?? product.localizedPricingUnitLabel,
            imageUrl: product.imageUrl,
            quantity: quantity
        )
    }
}
