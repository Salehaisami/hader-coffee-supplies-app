import SwiftUI

/// Profile setup screen for new users after OTP verification.
/// Captures: business name (required), contact name (required), email (optional).
struct ProfileSetupView: View {
    @Bindable var viewModel: AuthViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.lg) {
                // Header
                VStack(spacing: Spacing.xxs) {
                    Text(L10n.profileTitle)
                        .font(.appTitle2)
                        .foregroundStyle(Color.primaryText)
                }
                .padding(.top, Spacing.xxl)

                // Form fields
                VStack(spacing: Spacing.sm) {
                    InputField(
                        label: L10n.businessName,
                        text: $viewModel.businessName,
                        contentType: .organizationName
                    )

                    InputField(
                        label: L10n.contactName,
                        text: $viewModel.contactName,
                        contentType: .name
                    )

                    InputField(
                        label: L10n.emailOptional,
                        text: $viewModel.email,
                        keyboardType: .emailAddress,
                        contentType: .emailAddress
                    )
                }

                // Error message
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.appCaption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                // Continue button
                PrimaryButton(
                    L10n.continueButton,
                    isLoading: false,
                    isDisabled: !viewModel.canCompleteProfile
                ) {
                    Task { await viewModel.completeProfile() }
                }
                .padding(.top, Spacing.sm)
            }
            .padding(.horizontal, Spacing.lg)
        }
        .background(Color.appBackground)
    }
}

// MARK: - Input Field Component

/// Styled text field for form inputs.
private struct InputField: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var contentType: UITextContentType?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xxxs) {
            Text(label)
                .font(.appCaption)
                .foregroundStyle(Color.secondaryText)

            TextField(label, text: $text)
                .font(.appBody)
                .keyboardType(keyboardType)
                .textContentType(contentType)
                .padding(.vertical, Spacing.xs)
                .padding(.horizontal, Spacing.sm)
                .background(Color.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
                .overlay(
                    RoundedRectangle(cornerRadius: Shape.inputRadius)
                        .stroke(Color.divider, lineWidth: Shape.border)
                )
                .accessibilityLabel(label)
        }
    }
}

#Preview {
    let vm = AuthViewModel(authService: FirebaseAuthService())
    ProfileSetupView(viewModel: vm)
        .environment(LanguageManager.shared)
}
