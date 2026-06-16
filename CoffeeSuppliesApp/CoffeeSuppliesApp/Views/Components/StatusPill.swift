import SwiftUI

/// Order status enum used across the app.
enum OrderStatus: String, Codable, CaseIterable {
    case pending
    case sentToSupplier = "sent_to_supplier"
    case delivered
    case cancelled
}

/// Status pill: renders a colored pill based on order status.
/// - pending: Stone400 background
/// - sent_to_supplier: Clay background
/// - delivered: Sage background
/// - cancelled: Stone200 background + InkSoft text
struct StatusPill: View {
    let status: OrderStatus

    var body: some View {
        Text(statusLabel)
            .font(.appCaption)
            .fontWeight(.medium)
            .foregroundStyle(textColor)
            .padding(.horizontal, Spacing.xxs)
            .padding(.vertical, Spacing.xxxs)
            .background(backgroundColor)
            .clipShape(Capsule())
    }

    private var statusLabel: String {
        switch status {
        case .pending: return L10n.statusPending
        case .sentToSupplier: return L10n.statusSent
        case .delivered: return L10n.statusDelivered
        case .cancelled: return L10n.statusCancelled
        }
    }

    private var backgroundColor: Color {
        switch status {
        case .pending: return .stone400
        case .sentToSupplier: return .clay
        case .delivered: return .sage
        case .cancelled: return .stone200
        }
    }

    private var textColor: Color {
        switch status {
        case .pending: return .white
        case .sentToSupplier: return .white
        case .delivered: return .white
        case .cancelled: return .inkSoft
        }
    }
}

/// In-stock tag: Sage background, white text pill.
struct InStockTag: View {
    var body: some View {
        Text(L10n.inStock)
            .font(.appCaption)
            .fontWeight(.medium)
            .foregroundStyle(.white)
            .padding(.horizontal, Spacing.xxs)
            .padding(.vertical, Spacing.xxxs)
            .background(Color.sage)
            .clipShape(Capsule())
    }
}

#Preview {
    VStack(spacing: Spacing.sm) {
        ForEach(OrderStatus.allCases, id: \.rawValue) { status in
            StatusPill(status: status)
        }
        InStockTag()
    }
    .padding()
    .background(Color.appBackground)
}
