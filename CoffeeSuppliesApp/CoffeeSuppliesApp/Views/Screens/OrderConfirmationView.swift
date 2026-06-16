import SwiftUI

/// Order confirmation screen shown after a successful checkout.
/// Shows order number, item count, status, and navigation to order detail or back to shop.
struct OrderConfirmationView: View {
    let order: Order
    let onViewOrder: () -> Void
    let onBackToShop: () -> Void

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(Color.positive)

            VStack(spacing: Spacing.xxs) {
                Text(L10n.orderPlaced)
                    .font(.appTitle2)
                    .foregroundStyle(Color.primaryText)

                Text("\(L10n.orderNumber) \(order.id.prefix(8))")
                    .font(.appMonoSmall)
                    .foregroundStyle(Color.secondaryText)

                Text(L10n.orderConfirmationMessage)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.top, Spacing.xxs)
            }

            StatusPill(status: order.status)

            Spacer()

            VStack(spacing: Spacing.xs) {
                PrimaryButton(L10n.viewOrder) {
                    onViewOrder()
                }

                SecondaryButton(L10n.backToShop) {
                    onBackToShop()
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xxxl)
        }
        .padding(.horizontal, Spacing.lg)
        .background(Color.appBackground)
        .navigationBarBackButtonHidden(true)
    }
}
