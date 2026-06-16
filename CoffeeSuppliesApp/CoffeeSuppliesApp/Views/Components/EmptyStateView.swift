import SwiftUI

/// Empty state component: centered icon (SF Symbol), message, single action button.
/// Used for: empty cart, no orders, no search results, location denied, offline, etc.
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String?
    let actionTitle: String?
    let action: (() -> Void)?

    init(
        icon: String,
        title: String,
        message: String? = nil,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.message = message
        self.actionTitle = actionTitle
        self.action = action
    }

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Color.stone400)

            VStack(spacing: Spacing.xxs) {
                Text(title)
                    .font(.appHeadline)
                    .foregroundStyle(Color.primaryText)
                    .multilineTextAlignment(.center)

                if let message {
                    Text(message)
                        .font(.appBody)
                        .foregroundStyle(Color.secondaryText)
                        .multilineTextAlignment(.center)
                }
            }

            if let actionTitle, let action {
                SecondaryButton(actionTitle, action: action)
                    .frame(maxWidth: 240)
            }
        }
        .padding(Spacing.xxl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    EmptyStateView(
        icon: "cart",
        title: L10n.cartEmptyTitle,
        message: L10n.cartEmptyMessage,
        actionTitle: L10n.browseSupplies,
        action: {}
    )
    .background(Color.appBackground)
}
