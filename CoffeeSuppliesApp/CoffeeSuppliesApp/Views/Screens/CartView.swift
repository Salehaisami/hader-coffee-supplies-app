import SwiftUI

/// Cart tab: line items with quantity edit/remove, subtotal, and a sticky checkout CTA.
/// Checkout routes guests through sign-in first. Empty cart shows a directional state.
struct CartView: View {
    @Environment(CartStore.self) private var cart
    @State private var showSignIn = false
    @State private var showCheckout = false

    let authService: AuthServiceProtocol
    let firestoreService: FirestoreServiceProtocol?
    let paymentService: PaymentServiceProtocol
    let locationService: LocationServiceProtocol

    init(
        authService: AuthServiceProtocol,
        firestoreService: FirestoreServiceProtocol? = nil,
        paymentService: PaymentServiceProtocol = ApplePayService(),
        locationService: LocationServiceProtocol = SystemLocationService()
    ) {
        self.authService = authService
        self.firestoreService = firestoreService
        self.paymentService = paymentService
        self.locationService = locationService
    }

    var body: some View {
        NavigationStack {
            Group {
                if cart.isEmpty {
                    emptyState
                } else {
                    cartContent
                }
            }
            .navigationTitle(L10n.cartTitle)
            .background(Color.appBackground)
            .navigationDestination(isPresented: $showCheckout) {
                checkoutDestination
            }
            .sheet(isPresented: $showSignIn) {
                AuthFlowView(
                    authService: authService,
                    firestoreService: firestoreService,
                    onComplete: { _ in
                        showSignIn = false
                        showCheckout = true
                    }
                )
            }
        }
    }

    // MARK: - Checkout Destination

    @ViewBuilder
    private var checkoutDestination: some View {
        if let firestoreService, let customerId = currentCustomerId {
            CheckoutView(
                viewModel: CheckoutViewModel(
                    cart: cart,
                    firestoreService: firestoreService,
                    paymentService: paymentService,
                    customerId: customerId
                ),
                locationService: locationService,
                onOrderPlaced: { _ in
                    // Cart is cleared by the view model; return to the (now empty) cart.
                    // T4.4 replaces this with navigation to the order confirmation screen.
                    showCheckout = false
                }
            )
        }
    }

    private var currentCustomerId: String? {
        if case .signedIn(let id) = authService.currentState { return id }
        return nil
    }

    // MARK: - Cart Content

    private var cartContent: some View {
        VStack(spacing: 0) {
            List {
                ForEach(cart.items) { item in
                    CartRow(
                        item: item,
                        quantity: binding(for: item),
                        onRemove: { cart.remove(id: item.id) }
                    )
                }
            }
            .listStyle(.plain)

            checkoutBar
        }
    }

    private func binding(for item: CartItem) -> Binding<Int> {
        Binding(
            get: { item.quantity },
            set: { cart.updateQuantity(for: item.id, to: $0) }
        )
    }

    private var checkoutBar: some View {
        VStack(spacing: Spacing.xs) {
            Divider().overlay(Color.divider)

            // Subtotal — ledger style
            HStack {
                Text(L10n.subtotal)
                    .font(.appHeadline)
                    .foregroundStyle(Color.primaryText)
                Spacer()
                Text(NumberFormatting.priceWithCurrency(cart.subtotal))
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
            }
            .padding(.horizontal, Spacing.sm)

            PrimaryButton(L10n.checkout) {
                startCheckout()
            }
            .padding(.horizontal, Spacing.sm)
            .padding(.bottom, Spacing.sm)
        }
        .background(Color.appBackground)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        EmptyStateView(
            icon: "cart",
            title: L10n.cartEmptyTitle,
            message: L10n.cartEmptyMessage,
            actionTitle: L10n.browseSupplies,
            action: {
                // Switch to Shop tab — notify parent via notification or tab binding
                // For now, the user can tap the Shop tab directly
            }
        )
    }

    // MARK: - Actions

    private func startCheckout() {
        if case .signedIn = authService.currentState {
            showCheckout = true
        } else {
            showSignIn = true
        }
    }
}

// MARK: - Cart Row

/// One cart line: name + variant label, ledger unit price, quantity stepper, line total, remove.
private struct CartRow: View {
    let item: CartItem
    @Binding var quantity: Int
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: Spacing.sm) {
            // Image placeholder
            Image(systemName: "cup.and.saucer")
                .font(.system(size: 24))
                .foregroundStyle(Color.stone400)
                .frame(width: 56, height: 56)
                .background(Color.stone100)
                .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))

            VStack(alignment: .leading, spacing: Spacing.xxxs) {
                // Name + variant label
                Text(displayName)
                    .font(.appSubheadline)
                    .foregroundStyle(Color.primaryText)
                    .lineLimit(2)

                // Unit price — localized format handles RTL/LTR correctly
                Text(L10n.pricePerUnit(price: NumberFormatting.price(item.unitPrice), unit: item.pricingUnitLabel))
                    .font(.appMonoSmall)
                    .foregroundStyle(Color.secondaryText)
                    .environment(\.layoutDirection, .leftToRight)

                // Quantity stepper
                QuantityStepper(quantity: $quantity)
                    .padding(.top, Spacing.xxxs)
            }

            Spacer()

            // Line total
            Text(NumberFormatting.price(item.lineTotal))
                .font(.appMonoPrice)
                .foregroundStyle(Color.primaryText)
        }
        .padding(.vertical, Spacing.xxs)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive, action: onRemove) {
                Label(L10n.remove, systemImage: "trash")
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(displayName)
        .accessibilityValue("\(NumberFormatting.quantity(item.quantity))")
    }

    private var displayName: String {
        if let variant = item.variantLabel {
            return "\(item.name) · \(variant)"
        }
        return item.name
    }
}

#if DEBUG
#Preview("With Items") {
    let cart = CartStore()
    cart.add(CartItem(product: .previewWithVariants, variant: Product.previewWithVariants.defaultVariant, quantity: 3))
    cart.add(CartItem(product: .previewMadeToOrder, variant: nil, quantity: 1))
    return CartView(authService: FirebaseAuthService())
        .environment(cart)
        .environment(LanguageManager.shared)
}

#Preview("Empty") {
    CartView(authService: FirebaseAuthService())
        .environment(CartStore())
        .environment(LanguageManager.shared)
}
#endif
