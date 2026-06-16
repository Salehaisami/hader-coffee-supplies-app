import SwiftUI

/// Primary action button: Clay fill, white text, 14pt radius.
/// Supports disabled state (0.4 opacity) and loading state (activity indicator).
struct PrimaryButton: View {
    let title: String
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    init(
        _ title: String,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.xxs) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.8)
                }
                Text(title)
                    .font(.appHeadline)
                    .foregroundStyle(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
            .background(Color.appAccent)
            .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))
        }
        .disabled(isDisabled || isLoading)
        .opacity((isDisabled || isLoading) ? 0.4 : 1.0)
        .accessibilityLabel(title)
    }
}

/// Secondary button: Stone 100 background, Ink text.
/// Same shape and states as PrimaryButton.
struct SecondaryButton: View {
    let title: String
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    init(
        _ title: String,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.xxs) {
                if isLoading {
                    ProgressView()
                        .tint(Color.ink)
                        .scaleEffect(0.8)
                }
                Text(title)
                    .font(.appHeadline)
                    .foregroundStyle(Color.primaryText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
            .background(Color.stone100)
            .clipShape(RoundedRectangle(cornerRadius: Shape.cardRadius))
        }
        .disabled(isDisabled || isLoading)
        .opacity((isDisabled || isLoading) ? 0.4 : 1.0)
        .accessibilityLabel(title)
    }
}

#Preview {
    VStack(spacing: Spacing.sm) {
        PrimaryButton("إتمام الطلب", action: {})
        PrimaryButton("Loading...", isLoading: true, action: {})
        PrimaryButton("Disabled", isDisabled: true, action: {})
        SecondaryButton("تصفح المنتجات", action: {})
        SecondaryButton("Disabled", isDisabled: true, action: {})
    }
    .padding()
    .background(Color.appBackground)
}
