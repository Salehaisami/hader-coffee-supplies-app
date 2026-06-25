import SwiftUI
import CoreLocation

/// Checkout: delivery pin location, business info, payment selector,
/// and place-order with order assembly.
struct CheckoutView: View {
    @Bindable var viewModel: CheckoutViewModel
    @State private var showLocationPicker = false

    private let locationService: LocationServiceProtocol
    var onOrderPlaced: (Order) -> Void

    init(
        viewModel: CheckoutViewModel,
        locationService: LocationServiceProtocol = SystemLocationService(),
        onOrderPlaced: @escaping (Order) -> Void
    ) {
        self.viewModel = viewModel
        self.locationService = locationService
        self.onOrderPlaced = onOrderPlaced
    }

    var body: some View {
        VStack(spacing: 0) {
            Form {
                if viewModel.isSuspended {
                    Section {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(Color.clay)
                            Text(L10n.accountSuspended)
                                .font(.appSubheadline)
                                .foregroundStyle(Color.clay)
                        }
                    }
                }
                deliverySection
                businessSection
                paymentSection
            }
            placeOrderBar
        }
        .background(Color.appBackground)
        .navigationTitle(L10n.checkoutTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.loadUserProfile() }
        .fullScreenCover(isPresented: $showLocationPicker) {
            LocationPickerCoverView(
                locationService: locationService,
                initialCoordinate: viewModel.deliveryCoordinate ?? JeddahGeofence.center,
                onConfirm: { coordinate in
                    viewModel.deliveryCoordinate = coordinate
                    showLocationPicker = false
                },
                onCancel: {
                    showLocationPicker = false
                }
            )
        }
        .onChange(of: viewModel.placedOrder) { _, order in
            if let order { onOrderPlaced(order) }
        }
    }
}

// MARK: - Sections

private extension CheckoutView {

    var deliverySection: some View {
        Section(L10n.deliveryDetails) {
            Button {
                showLocationPicker = true
            } label: {
                HStack(spacing: Spacing.xs) {
                    Image(systemName: "mappin.and.ellipse")
                        .foregroundStyle(Color.appAccent)
                    Text(viewModel.deliveryCoordinate == nil ? L10n.checkoutSetLocation : L10n.checkoutEditLocation)
                        .font(.appBody)
                        .foregroundStyle(Color.primaryText)
                    Spacer()
                    if viewModel.deliveryCoordinate != nil {
                        Image(systemName: "checkmark").foregroundStyle(Color.positive)
                    }
                    Image(systemName: "chevron.forward")
                        .font(.appCaption)
                        .foregroundStyle(Color.stone400)
                }
            }

            if viewModel.deliveryCoordinate != nil && !viewModel.isInJeddah {
                Text(viewModel.outOfZoneMessage)
                    .font(.appCaption)
                    .foregroundStyle(Color.clay)
            }
        }
    }

    var businessSection: some View {
        Section(L10n.businessDetails) {
            TextField(L10n.checkoutBusinessName, text: $viewModel.businessName)
            TextField(L10n.checkoutPhone, text: $viewModel.phone)
                .keyboardType(.phonePad)
        }
    }

    var paymentSection: some View {
        Section(L10n.payment) {
            if viewModel.isApplePayAvailable {
                paymentRow(.applePay, label: L10n.applePay, icon: "apple.logo")
            }
            paymentRow(.cashOnDelivery, label: L10n.cashOnDelivery, icon: "banknote")

            if viewModel.showApplePayFallback {
                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    if let error = viewModel.errorMessage {
                        Text(error).font(.appCaption).foregroundStyle(.red)
                    }
                    Button(L10n.switchToCOD) {
                        viewModel.switchToCashOnDelivery()
                    }
                    .font(.appSubheadline)
                    .foregroundStyle(Color.appAccent)
                }
            }
        }
    }

    func paymentRow(_ method: PaymentMethod, label: String, icon: String) -> some View {
        Button {
            viewModel.selectedPaymentMethod = method
        } label: {
            HStack(spacing: Spacing.xs) {
                Image(systemName: icon).foregroundStyle(Color.primaryText)
                Text(label).font(.appBody).foregroundStyle(Color.primaryText)
                Spacer()
                Image(systemName: viewModel.selectedPaymentMethod == method ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(viewModel.selectedPaymentMethod == method ? Color.appAccent : Color.stone400)
            }
        }
    }

    var placeOrderBar: some View {
        VStack(spacing: Spacing.xs) {
            Divider().overlay(Color.divider)
            HStack {
                Text(L10n.subtotal)
                    .font(.appHeadline)
                    .foregroundStyle(Color.primaryText)
                Spacer()
                Text(NumberFormatting.priceWithCurrency(viewModel.total))
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
            }
            .padding(.horizontal, Spacing.sm)

            if let limitMessage = viewModel.orderLimitMessage {
                Text(limitMessage)
                    .font(.appCaption)
                    .foregroundStyle(Color.clay)
                    .padding(.horizontal, Spacing.sm)
            }

            PrimaryButton(
                L10n.placeOrder,
                isLoading: viewModel.isPlacingOrder,
                isDisabled: !viewModel.canPlaceOrder
            ) {
                Task { await viewModel.placeOrder() }
            }
            .padding(.horizontal, Spacing.sm)
            .padding(.bottom, Spacing.sm)
        }
        .background(Color.appBackground)
    }
}
