import SwiftUI

/// Product detail screen: image, name/description, variant selector (when applicable),
/// live price/stock/delivery, quantity stepper, made-to-order note, and a sticky add-to-cart bar.
struct ProductDetailView: View {
    @Bindable var viewModel: ProductDetailViewModel

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    productImage

                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        // Name + ledger price
                        nameAndPrice

                        // Variant selector (only when product has variants)
                        if viewModel.showVariantSelector {
                            variantSelector
                        }

                        // Delivery + stock
                        deliveryAndStock

                        // Made-to-order note
                        if viewModel.isMadeToOrder {
                            madeToOrderNote
                        }

                        Divider()
                            .overlay(Color.divider)

                        // Description
                        Text(viewModel.localizedDescription)
                            .font(.appBody)
                            .foregroundStyle(Color.secondaryText)
                            .lineSpacing(4)

                        // Quantity
                        quantityRow
                    }
                    .padding(.horizontal, Spacing.lg)
                }
                .padding(.bottom, Spacing.xl)
            }

            // Sticky add-to-cart bar
            addToCartBar
        }
        .background(Color.appBackground)
        .navigationTitle(viewModel.localizedName)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Image

    @ViewBuilder
    private var productImage: some View {
        Group {
            if let url = viewModel.product.imageUrl, let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFit()
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
        .frame(height: 240)
        .frame(maxWidth: .infinity)
        .background(Color.stone100)
    }

    private var placeholderImage: some View {
        Image(systemName: "cup.and.saucer")
            .font(.system(size: 56))
            .foregroundStyle(Color.stone400)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Name & Price

    private var nameAndPrice: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(viewModel.localizedName)
                .font(.appTitle2)
                .foregroundStyle(Color.primaryText)

            // Ledger-line price: rendered as a single LTR-isolated line to prevent
            // bidi reordering of numerals, "SAR", slash, and unit labels in RTL.
            VStack(alignment: .leading, spacing: 2) {
                Text(L10n.pricePerUnit(price: NumberFormatting.price(viewModel.currentPrice), unit: viewModel.currentPricingUnitLabel))
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
                    .environment(\.layoutDirection, .leftToRight)
                Rectangle()
                    .fill(Color.divider)
                    .frame(height: Shape.hairline)
            }
        }
    }

    // MARK: - Variant Selector

    private var variantSelector: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(L10n.selectVariant)
                .font(.appCaption)
                .foregroundStyle(Color.secondaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.xxs) {
                    ForEach(viewModel.product.variants) { variant in
                        VariantChip(
                            label: variant.localizedLabel,
                            isSelected: variant.variantId == viewModel.selectedVariantId,
                            isAvailable: variant.inStock,
                            action: { viewModel.selectVariant(variant.variantId) }
                        )
                    }
                }
            }
        }
    }

    // MARK: - Delivery & Stock

    private var deliveryAndStock: some View {
        HStack(spacing: Spacing.sm) {
            Label {
                Text(L10n.deliveryEstimateFormatted(viewModel.deliveryEstimate))
                    .font(.appSubheadline)
                    .foregroundStyle(Color.secondaryText)
            } icon: {
                Image(systemName: "shippingbox")
                    .foregroundStyle(Color.appAccent)
            }

            Spacer()

            if viewModel.isAvailable {
                Text(L10n.inStock)
                    .font(.appCaption)
                    .foregroundStyle(.white)
                    .padding(.horizontal, Spacing.xxs)
                    .padding(.vertical, Spacing.xxxs)
                    .background(Color.positive)
                    .clipShape(Capsule())
            } else {
                Text(L10n.outOfStock)
                    .font(.appCaption)
                    .foregroundStyle(Color.secondaryText)
                    .padding(.horizontal, Spacing.xxs)
                    .padding(.vertical, Spacing.xxxs)
                    .background(Color.stone200)
                    .clipShape(Capsule())
            }
        }
    }

    // MARK: - Made to Order

    private var madeToOrderNote: some View {
        HStack(alignment: .top, spacing: Spacing.xxs) {
            Image(systemName: "clock.badge.exclamationmark")
                .foregroundStyle(Color.appAccent)
            VStack(alignment: .leading, spacing: 2) {
                Text(L10n.madeToOrder)
                    .font(.appSubheadline)
                    .foregroundStyle(Color.primaryText)
                Text(L10n.madeToOrderNote)
                    .font(.appCaption)
                    .foregroundStyle(Color.secondaryText)
            }
        }
        .padding(Spacing.xs)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.stone100)
        .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
    }

    // MARK: - Quantity

    private var quantityRow: some View {
        HStack {
            Text(quantityLabel)
                .font(.appHeadline)
                .foregroundStyle(Color.primaryText)
            Spacer()
            QuantityStepper(quantity: $viewModel.quantity)
        }
    }

    private var quantityLabel: String {
        LanguageManager.shared.resolve(ar: "الكمية", en: "Quantity")
    }

    // MARK: - Sticky Add-to-Cart Bar

    private var addToCartBar: some View {
        VStack(spacing: 0) {
            Divider()
                .overlay(Color.divider)

            PrimaryButton(
                L10n.addToCart,
                isDisabled: !viewModel.canAddToCart
            ) {
                viewModel.addToCart()
            }
            .padding(Spacing.sm)
        }
        .background(Color.appBackground)
    }
}

// MARK: - Variant Chip

/// Selectable variant chip. Shows unavailable variants with a struck-through, dimmed style.
private struct VariantChip: View {
    let label: String
    let isSelected: Bool
    let isAvailable: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.appSubheadline)
                .foregroundStyle(foreground)
                .strikethrough(!isAvailable, color: Color.stone400)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xxs)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
                .overlay(
                    RoundedRectangle(cornerRadius: Shape.inputRadius)
                        .stroke(isSelected ? Color.appAccent : Color.divider, lineWidth: isSelected ? 2 : Shape.border)
                )
        }
        .accessibilityLabel(label)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .accessibilityHint(isAvailable ? "" : L10n.outOfStock)
    }

    private var foreground: Color {
        if !isAvailable { return Color.stone400 }
        return isSelected ? Color.appAccent : Color.primaryText
    }

    private var background: Color {
        isSelected ? Color.appAccent.opacity(0.08) : Color.cardBackground
    }
}

#Preview("With Variants") {
    NavigationStack {
        ProductDetailView(viewModel: ProductDetailViewModel(product: .previewWithVariants))
    }
    .environment(LanguageManager.shared)
}

#Preview("Made to Order") {
    NavigationStack {
        ProductDetailView(viewModel: ProductDetailViewModel(product: .previewMadeToOrder))
    }
    .environment(LanguageManager.shared)
}
