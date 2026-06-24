import SwiftUI

/// Step 1 of OTP flow: phone number entry.
struct PhoneEntryView: View {
    @Bindable var viewModel: AuthViewModel
    @FocusState private var isPhoneFocused: Bool

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Spacer()

            // Header
            VStack(spacing: Spacing.xxs) {
                Text(L10n.phoneTitle)
                    .font(.appTitle2)
                    .foregroundStyle(Color.primaryText)

                Text(L10n.phoneSubtitle)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
            }
            .multilineTextAlignment(.center)

            // Phone input
            HStack(spacing: Spacing.xxs) {
                Text("+966")
                    .font(.appMonoPrice)
                    .foregroundStyle(Color.primaryText)
                    .padding(.leading, Spacing.sm)

                TextField("5X XXX XXXX", text: $viewModel.phoneNumber)
                    .font(.appMonoPrice)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .focused($isPhoneFocused)
                    .accessibilityLabel(L10n.phoneSubtitle)
            }
            .padding(.vertical, Spacing.sm)
            .padding(.trailing, Spacing.sm)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
            .overlay(
                RoundedRectangle(cornerRadius: Shape.inputRadius)
                    .stroke(Color.divider, lineWidth: Shape.border)
            )

            // Error message
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.appCaption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            // Send code button
            PrimaryButton(
                L10n.sendCode,
                isLoading: viewModel.step == .sendingCode,
                isDisabled: !viewModel.canSendCode
            ) {
                Task { await viewModel.sendCode() }
            }

            Spacer()
            Spacer()
        }
        .padding(.horizontal, Spacing.lg)
        .background(Color.appBackground)
        .onAppear { isPhoneFocused = true }
    }
}

#Preview {
    PhoneEntryView(viewModel: AuthViewModel(authService: FirebaseAuthService()))
        .environment(LanguageManager.shared)
}
