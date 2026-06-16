import SwiftUI

/// Container that drives the multi-step OTP authentication flow.
/// Transitions between PhoneEntry → CodeVerification → ProfileSetup based on AuthViewModel state.
struct AuthFlowView: View {
    @State private var viewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    /// Called when authentication is fully complete (signed in + profile set up).
    var onComplete: ((String) -> Void)?

    init(authService: AuthServiceProtocol, firestoreService: FirestoreServiceProtocol? = nil, onComplete: ((String) -> Void)? = nil) {
        _viewModel = State(wrappedValue: AuthViewModel(authService: authService, firestoreService: firestoreService))
        self.onComplete = onComplete
    }

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.step {
                case .phoneEntry, .sendingCode:
                    PhoneEntryView(viewModel: viewModel)

                case .codeSent, .verifying:
                    CodeVerificationView(viewModel: viewModel)

                case .profileSetup:
                    ProfileSetupView(viewModel: viewModel)

                case .authenticated:
                    // Brief state before dismiss
                    Color.appBackground
                }
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(L10n.cancel) {
                        dismiss()
                    }
                    .foregroundStyle(Color.appAccent)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            viewModel.onAuthComplete = { userId in
                onComplete?(userId)
                dismiss()
            }
        }
    }
}

#Preview {
    AuthFlowView(authService: FirebaseAuthService())
        .environment(LanguageManager.shared)
}
