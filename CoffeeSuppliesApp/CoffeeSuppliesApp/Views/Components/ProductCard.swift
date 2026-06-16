import SwiftUI

/// Product card component with image, name, ledger-line price, and add-to-cart button.
/// Shows "from" prefix for variant items (lowest variant price).
struct ProductCard: View {
    let name: String
    let imageURL: String?
    let categoryIcon: String? // SF Symbol fallback
    let price: Double
    let pricingUnitLabel: String
    let hasVariants: Bool
    let inStock: Bool
    let onAddToCart: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            // Image
            productImage
                .frame(height: 120)
                .frame(maxWidth: .infinity)
                .background(Color.stone100)
                .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))

            // Name
            Text(name)
                .font(.appSubheadline)
                .foregroundStyle(Color.primaryText)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            // Ledger price line
            ledgerPriceLine

            // Add to cart button or out-of-stock tag
            if inStock {
                Button(action: onAddToCart) {
                    Text(L10n.addToCartShort)
                        .font(.appCaption)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.xxs)
                        .background(Color.appAccent)
                        .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))
                }
                .accessibilityLabel(L10n.addToCart)
            } else {
                OutOfStockTag()
            }
        }
        .padding(Spacing.xs)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))
    }

    // MARK: - Subviews

    @ViewBuilder
    private var productImage: some View {
        if let url = imageURL, let imageUrl = URL(string: url) {
            AsyncImage(url: imageUrl) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                case .failure:
                    placeholderImage
                case .empty:
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                @unknown default:
                    placeholderImage
                }
            }
        } else {
            placeholderImage
        }
    }

    private var placeholderImage: some View {
        Image(systemName: categoryIcon ?? "cup.and.saucer")
            .font(.system(size: 32))
            .foregroundStyle(Color.stone400)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var ledgerPriceLine: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: Spacing.xxxs) {
                if hasVariants {
                    Text(L10n.fromPrice)
                        .font(.appCaption)
                        .foregroundStyle(Color.secondaryText)
                }
                // Price + unit rendered as a single LTR-isolated string to prevent
                // bidi reordering of numerals, "SAR", slash, and unit labels.
                Text(priceDisplayString)
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
                    .environment(\.layoutDirection, .leftToRight)
            }
            // The signature hairline rule
            Rectangle()
                .fill(Color.divider)
                .frame(height: Shape.hairline)
        }
    }

    /// Composite price string using localized format: "48 SAR / dozen" or "48 ر.س / دزينة"
    private var priceDisplayString: String {
        L10n.pricePerUnit(price: NumberFormatting.price(price), unit: pricingUnitLabel)
    }
}

// MARK: - Out of Stock Tag

struct OutOfStockTag: View {
    var body: some View {
        Text(L10n.outOfStock)
            .font(.appCaption)
            .foregroundStyle(Color.secondaryText)
            .padding(.horizontal, Spacing.xxs)
            .padding(.vertical, Spacing.xxxs)
            .background(Color.stone200)
            .clipShape(Capsule())
    }
}

#Preview {
    HStack {
        ProductCard(
            name: "كوب ورقي (ساخن)",
            imageURL: nil,
            categoryIcon: "cup.and.saucer",
            price: 48,
            pricingUnitLabel: "dozen",
            hasVariants: true,
            inStock: true,
            onAddToCart: {}
        )
        ProductCard(
            name: "Paper Cup (hot)",
            imageURL: nil,
            categoryIcon: "cup.and.saucer",
            price: 120,
            pricingUnitLabel: "case",
            hasVariants: false,
            inStock: false,
            onAddToCart: {}
        )
    }
    .padding()
    .background(Color.appBackground)
}
