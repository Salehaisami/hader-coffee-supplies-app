import SwiftUI

/// Edit screen for business profile details (name, contact, email).
struct BusinessDetailsEditView: View {
    @State private var businessName: String
    @State private var contactName: String
    @State private var email: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @Environment(\.dismiss) private var dismiss

    private let userId: String
    private let firestoreService: FirestoreServiceProtocol

    init(user: AppUser, firestoreService: FirestoreServiceProtocol) {
        self.userId = user.id
        self.firestoreService = firestoreService
        _businessName = State(initialValue: user.businessName)
        _contactName = State(initialValue: user.contactName)
        _email = State(initialValue: user.email ?? "")
    }

    var body: some View {
        Form {
            Section {
                TextField(L10n.businessName, text: $businessName)
                    .textContentType(.organizationName)

                TextField(L10n.contactName, text: $contactName)
                    .textContentType(.name)

                TextField(L10n.emailOptional, text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .font(.appCaption)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(L10n.businessDetails)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(L10n.save) {
                    Task { await save() }
                }
                .disabled(!canSave || isSaving)
            }
        }
        .overlay {
            if showSuccess {
                successToast
            }
        }
    }

    private var canSave: Bool {
        !businessName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !contactName.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            var fields: [String: Any] = [
                "businessName": businessName.trimmingCharacters(in: .whitespaces),
                "contactName": contactName.trimmingCharacters(in: .whitespaces),
            ]
            let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
            fields["email"] = trimmedEmail.isEmpty ? nil : trimmedEmail
            try await firestoreService.updateDocument(
                collection: "users",
                documentId: userId,
                fields: fields
            )
            showSuccess = true
            try? await Task.sleep(for: .seconds(1))
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    private var successToast: some View {
        VStack {
            Spacer()
            Text("✓")
                .font(.system(size: 48))
                .padding()
                .background(Color.positive.opacity(0.9))
                .clipShape(Circle())
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.2))
        .transition(.opacity)
    }
}
