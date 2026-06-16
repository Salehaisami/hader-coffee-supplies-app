import Foundation
import Observation

/// ViewModel for the product detail screen.
/// Derives live price / stock / delivery from the selected variant (when the product has variants).
@MainActor
@Observable
final class ProductDetailViewModel {
    // MARK: - State

    let product: Product
    var selectedVariantId: String?
    var quantity: Int = 1

    // MARK: - Dependencies

    /// Invoked when the user adds the current selection to the cart.
    /// Wired to the cart in T3.4; injected for testability.
    @ObservationIgnored private let onAddToCart: (CartItem) -> Void

    // MARK: - Init

    init(product: Product, onAddToCart: @escaping (CartItem) -> Void = { _ in }) {
        self.product = product
        self.onAddToCart = onAddToCart
        // Default to the first in-stock variant, falling back to the first variant.
        selectedVariantId = product.defaultVariant?.variantId
    }

    // MARK: - Actions

    func selectVariant(_ variantId: String) {
        selectedVariantId = variantId
    }

    func addToCart() {
        guard canAddToCart else { return }
        onAddToCart(CartItem(product: product, variant: selectedVariant, quantity: quantity))
    }

    // MARK: - Derived Display State

    /// Whether the variant selector should be shown.
    var showVariantSelector: Bool {
        product.hasVariants && !product.variants.isEmpty
    }

    /// The currently selected variant, if any.
    var selectedVariant: ProductVariant? {
        guard let id = selectedVariantId else { return nil }
        return product.variants.first { $0.variantId == id }
    }

    /// Current price — from the selected variant when present, else the base price.
    var currentPrice: Double {
        selectedVariant?.sellPrice ?? product.sellPrice
    }

    /// Current pricing unit label — from the selected variant when present, else the base label.
    var currentPricingUnitLabel: String {
        selectedVariant?.localizedPricingUnitLabel ?? product.localizedPricingUnitLabel
    }

    /// Availability — reflects the selected variant when present, else the base stock flag.
    var isAvailable: Bool {
        if showVariantSelector {
            return selectedVariant?.inStock ?? false
        }
        return product.inStock
    }

    /// Delivery estimate (product-level in the Phase One schema).
    var deliveryEstimate: String {
        product.deliveryEstimate.localizedString
    }

    /// Whether this is a made-to-order item (longer lead time + note).
    var isMadeToOrder: Bool {
        product.madeToOrder
    }

    /// Whether the add-to-cart action is enabled.
    var canAddToCart: Bool {
        isAvailable
    }

    var localizedName: String {
        product.localizedName
    }

    var localizedDescription: String {
        product.localizedDescription
    }
}
