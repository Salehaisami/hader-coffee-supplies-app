import SwiftUI

/// Order detail: 3-step status tracker, line items, delivery address with Google Maps link,
/// payment info, and cancel button (only for pending orders).
struct OrderDetailView: View {
    let order: Order
    /// Cancel callback. Nil if cancellation isn't allowed (non-pending orders).
    var onCancel: (() -> Void)?

    @State private var showCancelConfirm = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // Status tracker
                statusTracker

                Divider().overlay(Color.divider)

                // Items
                itemsSection

                Divider().overlay(Color.divider)

                // Delivery
                deliverySection

                Divider().overlay(Color.divider)

                // Payment + total
                paymentSection

                // Cancel button (pending only)
                if order.status == .pending, onCancel != nil {
                    cancelButton
                }
            }
            .padding(Spacing.lg)
        }
        .background(Color.appBackground)
        .navigationTitle("#\(order.id.prefix(8))")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(L10n.cancelOrderConfirm, isPresented: $showCancelConfirm, titleVisibility: .visible) {
            Button(L10n.cancelOrder, role: .destructive) { onCancel?() }
            Button(L10n.cancel, role: .cancel) { }
        }
    }
}

// MARK: - Sections

private extension OrderDetailView {

    var statusTracker: some View {
        VStack(spacing: Spacing.sm) {
            StatusPill(status: order.status)

            HStack(spacing: 0) {
                ForEach(0..<3) { step in
                    Circle()
                        .fill(step <= currentStep ? Color.appAccent : Color.stone200)
                        .frame(width: 12, height: 12)

                    if step < 2 {
                        Rectangle()
                            .fill(step < currentStep ? Color.appAccent : Color.stone200)
                            .frame(height: 2)
                    }
                }
            }

            HStack {
                ForEach(0..<3) { step in
                    Text(OrderTracker.label(for: step))
                        .font(.appCaption)
                        .foregroundStyle(step <= currentStep ? Color.primaryText : Color.stone400)
                        .frame(maxWidth: .infinity)
                }
            }
        }
    }

    var currentStep: Int { OrderTracker.currentStep(for: order.status) }

    var itemsSection: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            ForEach(order.items) { item in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(itemDisplayName(item))
                            .font(.appSubheadline)
                            .foregroundStyle(Color.primaryText)
                        Text("×\(item.quantity) · \(item.pricingUnitLabel)")
                            .font(.appCaption)
                            .foregroundStyle(Color.secondaryText)
                    }
                    Spacer()
                    Text(NumberFormatting.priceWithCurrency(item.lineTotal))
                        .font(.appMonoSmall)
                        .foregroundStyle(Color.primaryText)
                }
            }
        }
    }

    func itemDisplayName(_ item: OrderLineItem) -> String {
        if let variant = item.variantLabel {
            return "\(item.name) · \(variant)"
        }
        return item.name
    }

    var deliverySection: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(L10n.deliveryDetails)
                .font(.appHeadline)
                .foregroundStyle(Color.primaryText)

            Text(order.deliveryAddress.district)
                .font(.appBody)
                .foregroundStyle(Color.secondaryText)

            if let street = order.deliveryAddress.street {
                Text(street)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
            }

            if let url = order.googleMapsURL {
                Link(L10n.viewOnMap, destination: url)
                    .font(.appSubheadline)
                    .foregroundStyle(Color.appAccent)
            }
        }
    }

    var paymentSection: some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            HStack {
                Text(L10n.payment)
                    .font(.appHeadline)
                    .foregroundStyle(Color.primaryText)
                Spacer()
                Text(paymentLabel)
                    .font(.appSubheadline)
                    .foregroundStyle(Color.secondaryText)
            }

            HStack {
                Text(L10n.subtotal)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
                Spacer()
                Text(NumberFormatting.priceWithCurrency(order.total))
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
            }
        }
    }

    var paymentLabel: String {
        switch order.paymentMethod {
        case .applePay: return L10n.applePay
        case .cashOnDelivery: return L10n.cashOnDelivery
        }
    }

    var cancelButton: some View {
        Button(role: .destructive) {
            showCancelConfirm = true
        } label: {
            HStack {
                Image(systemName: "xmark.circle")
                Text(L10n.cancelOrder)
            }
            .font(.appSubheadline)
            .foregroundStyle(.red)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
            .background(Color.stone100)
            .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))
        }
    }
}
