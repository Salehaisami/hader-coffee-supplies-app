import SwiftUI

/// Step 2 of OTP flow: code verification with resend timer.
struct CodeVerificationView: View {
    @Bindable var viewModel: AuthViewModel
    @FocusState private var isCodeFocused: Bool

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Spacer()

            // Header
            VStack(spacing: Spacing.xxs) {
                Text(L10n.verifyCode)
                    .font(.appTitle2)
                    .foregroundStyle(Color.primaryText)

                Text(formattedSentTo)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
            }
            .multilineTextAlignment(.center)

            // Code input
            TextField("000000", text: $viewModel.verificationCode)
                .font(.appMonoPrice)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .multilineTextAlignment(.center)
                .focused($isCodeFocused)
                .padding(.vertical, Spacing.sm)
                .padding(.horizontal, Spacing.lg)
                .background(Color.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
                .overlay(
                    RoundedRectangle(cornerRadius: Shape.inputRadius)
                        .stroke(Color.divider, lineWidth: Shape.border)
                )
                .accessibilityLabel(L10n.verifyCode)
                .onChange(of: viewModel.verificationCode) { _, newValue in
                    // Limit to 6 digits
                    let filtered = String(newValue.filter(\.isNumber).prefix(AuthViewModel.codeLength))
                    if filtered != newValue {
                        viewModel.verificationCode = filtered
                    }
                }

            // Error message
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.appCaption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            // Verify button
            PrimaryButton(
                L10n.verifyCode,
                isLoading: viewModel.step == .verifying,
                isDisabled: !viewModel.canVerify
            ) {
                Task { await viewModel.verifyCode() }
            }

            // Resend
            resendView

            Spacer()
            Spacer()
        }
        .padding(.horizontal, Spacing.lg)
        .background(Color.appBackground)
        .onAppear { isCodeFocused = true }
    }

    // MARK: - Subviews

    @ViewBuilder
    private var resendView: some View {
        if viewModel.resendCountdown > 0 {
            Text("\(L10n.resend) \u{2066}0:\(String(format: "%02d", viewModel.resendCountdown))\u{2069}")
                .font(.appCaption)
                .foregroundStyle(Color.secondaryText)
        } else {
            Button {
                Task { await viewModel.resendCode() }
            } label: {
                Text(L10n.resend)
                    .font(.appHeadline)
                    .foregroundStyle(Color.appAccent)
            }
            .accessibilityLabel(L10n.resend)
        }
    }

    // MARK: - Helpers

    private var formattedSentTo: String {
        let phone = viewModel.formattedPhoneNumber
        let masked = String(phone.prefix(4)) + " •••• " + String(phone.suffix(4))
        return masked
    }
}

#Preview {
    let vm = AuthViewModel(authService: FirebaseAuthService())
    CodeVerificationView(viewModel: vm)
        .environment(LanguageManager.shared)
}
