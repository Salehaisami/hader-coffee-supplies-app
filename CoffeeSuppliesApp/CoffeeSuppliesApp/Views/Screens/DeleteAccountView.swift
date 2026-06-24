import SwiftUI
import FirebaseAuth

/// Account deletion confirmation screen.
/// Deletes the Firestore user document and Firebase Auth account.
struct DeleteAccountView: View {
    @State private var isDeleting = false
    @State private var showConfirmation = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var languageManager

    private let userId: String
    private let firestoreService: FirestoreServiceProtocol
    private let authService: AuthServiceProtocol

    init(userId: String, firestoreService: FirestoreServiceProtocol, authService: AuthServiceProtocol) {
        self.userId = userId
        self.firestoreService = firestoreService
        self.authService = authService
    }

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()

            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.clay)

            Text(deleteTitle)
                .font(.appTitle2)
                .foregroundStyle(Color.primaryText)
                .multilineTextAlignment(.center)

            Text(deleteMessage)
                .font(.appBody)
                .foregroundStyle(Color.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Spacing.lg)

            if let error = errorMessage {
                Text(error)
                    .font(.appCaption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.lg)
            }

            Spacer()

            VStack(spacing: Spacing.xs) {
                Button(role: .destructive) {
                    showConfirmation = true
                } label: {
                    Text(deleteButton)
                        .font(.appHeadline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
                .disabled(isDeleting)

                Button {
                    dismiss()
                } label: {
                    Text(L10n.cancel)
                        .font(.appHeadline)
                        .foregroundStyle(Color.primaryText)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.sm)
                }
                .disabled(isDeleting)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.xl)
        }
        .background(Color.appBackground)
        .navigationTitle(deleteTitle)
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(deleteConfirmTitle, isPresented: $showConfirmation, titleVisibility: .visible) {
            Button(deleteConfirmAction, role: .destructive) {
                Task { await deleteAccount() }
            }
            Button(L10n.cancel, role: .cancel) { }
        } message: {
            Text(deleteConfirmMessage)
        }
    }

    private func deleteAccount() async {
        isDeleting = true
        errorMessage = nil

        do {
            // Delete Firestore user document
            try await firestoreService.deleteDocument(collection: "users", documentId: userId)

            // Delete Firebase Auth account
            try await Auth.auth().currentUser?.delete()

            // Sign out locally
            try? authService.signOut()

            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            isDeleting = false
        }
    }

    // MARK: - Localized Strings

    private var deleteTitle: String {
        languageManager.resolve(ar: "حذف الحساب", en: "Delete Account")
    }
    private var deleteMessage: String {
        languageManager.resolve(
            ar: "سيتم حذف حسابك وجميع بياناتك بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.",
            en: "Your account and all associated data will be permanently deleted. This action cannot be undone."
        )
    }
    private var deleteButton: String {
        languageManager.resolve(ar: "حذف حسابي", en: "Delete My Account")
    }
    private var deleteConfirmTitle: String {
        languageManager.resolve(ar: "تأكيد الحذف", en: "Confirm Deletion")
    }
    private var deleteConfirmMessage: String {
        languageManager.resolve(
            ar: "هل أنت متأكد؟ سيتم حذف جميع بياناتك نهائياً.",
            en: "Are you sure? All your data will be permanently deleted."
        )
    }
    private var deleteConfirmAction: String {
        languageManager.resolve(ar: "نعم، احذف حسابي", en: "Yes, Delete My Account")
    }
}
