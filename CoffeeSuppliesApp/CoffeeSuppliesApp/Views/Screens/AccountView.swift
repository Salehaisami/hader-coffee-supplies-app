import SwiftUI

/// Account tab: shows user profile when signed in, or a sign-in prompt for guests.
struct AccountView: View {
    @State private var viewModel: AccountViewModel
    @Environment(LanguageManager.self) private var languageManager

    private let authService: AuthServiceProtocol
    private let firestoreService: FirestoreServiceProtocol?

    init(authService: AuthServiceProtocol, firestoreService: FirestoreServiceProtocol? = nil) {
        self.authService = authService
        self.firestoreService = firestoreService
        _viewModel = State(wrappedValue: AccountViewModel(authService: authService, firestoreService: firestoreService))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isSignedIn {
                    signedInContent
                } else {
                    guestContent
                }
            }
            .navigationTitle(L10n.accountTitle)
            .navigationBarTitleDisplayMode(.large)
            .background(Color.appBackground)
            .sheet(isPresented: Bindable(viewModel).showSignIn) {
                AuthFlowView(
                    authService: authService,
                    firestoreService: firestoreService,
                    onComplete: { userId in
                        viewModel.onAuthCompleted(userId: userId)
                    }
                )
            }
        }
        .id(languageManager.currentLanguage)
    }

    // MARK: - Signed In Content

    private var signedInContent: some View {
        List {
            // User header
            Section {
                VStack(alignment: .leading, spacing: Spacing.xxxs) {
                    Text(viewModel.user?.businessName ?? "")
                        .font(.appHeadline)
                        .foregroundStyle(Color.primaryText)

                    Text(viewModel.user?.phone ?? "")
                        .font(.appMonoSmall)
                        .foregroundStyle(Color.secondaryText)
                }
                .padding(.vertical, Spacing.xxs)
                .accessibilityElement(children: .combine)
            }

            // Menu items
            Section {
                if let user = viewModel.user, let firestoreService {
                    NavigationLink {
                        BusinessDetailsEditView(user: user, firestoreService: firestoreService)
                    } label: {
                        menuLabel(icon: "building.2", title: L10n.businessDetails)
                    }

                    NavigationLink {
                        DeliveryLocationEditView(
                            userId: user.id,
                            currentAddress: user.deliveryAddress,
                            firestoreService: firestoreService
                        )
                    } label: {
                        menuLabel(icon: "mappin.and.ellipse", title: L10n.deliveryLocation)
                    }
                }

                NavigationLink {
                    HelpView()
                } label: {
                    menuLabel(icon: "questionmark.circle", title: L10n.help)
                }
            }

            // Language toggle
            Section {
                languageToggleRow
            }

            // Sign out
            Section {
                Button(role: .destructive) {
                    viewModel.signOut()
                } label: {
                    HStack {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                        Text(L10n.signOut)
                    }
                    .foregroundStyle(.red)
                }
                .accessibilityLabel(L10n.signOut)
            }

            // Delete account
            if let firestoreService, let userId = currentUserId {
                Section {
                    NavigationLink {
                        DeleteAccountView(
                            userId: userId,
                            firestoreService: firestoreService,
                            authService: authService
                        )
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                            Text(deleteAccountLabel)
                        }
                        .foregroundStyle(.red)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var deleteAccountLabel: String {
        LanguageManager.shared.resolve(ar: "حذف الحساب", en: "Delete Account")
    }

    private var currentUserId: String? {
        if case .signedIn(let id) = authService.currentState { return id }
        return nil
    }

    // MARK: - Guest Content

    private var guestContent: some View {
        VStack(spacing: Spacing.lg) {
            EmptyStateView(
                icon: "person.crop.circle",
                title: L10n.accountTitle,
                message: L10n.guestPrompt,
                actionTitle: L10n.signIn,
                action: { viewModel.promptSignIn() }
            )

            // Language toggle available even for guests
            languageToggleButton
                .padding(.bottom, Spacing.xxl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }

    // MARK: - Subviews

    private func menuLabel(icon: String, title: String) -> some View {
        HStack(spacing: Spacing.xs) {
            Image(systemName: icon)
                .foregroundStyle(Color.appAccent)
                .frame(width: 24)

            Text(title)
                .font(.appBody)
                .foregroundStyle(Color.primaryText)
        }
    }

    private func menuRow(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Spacing.xs) {
                Image(systemName: icon)
                    .foregroundStyle(Color.appAccent)
                    .frame(width: 24)

                Text(title)
                    .font(.appBody)
                    .foregroundStyle(Color.primaryText)

                Spacer()

                Image(systemName: "chevron.forward")
                    .font(.appCaption)
                    .foregroundStyle(Color.stone400)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
    }

    private var languageToggleRow: some View {
        HStack(spacing: Spacing.xs) {
            Image(systemName: "globe")
                .foregroundStyle(Color.appAccent)
                .frame(width: 24)

            Text(L10n.language)
                .font(.appBody)
                .foregroundStyle(Color.primaryText)

            Spacer()

            Text(languageManager.currentLanguage.displayName)
                .font(.appCaption)
                .foregroundStyle(Color.secondaryText)
        }
        .contentShape(Rectangle())
        .onTapGesture {
            languageManager.toggle()
        }
        .accessibilityLabel(L10n.language)
        .accessibilityHint(languageManager.currentLanguage.displayName)
    }

    private var languageToggleButton: some View {
        Button {
            languageManager.toggle()
        } label: {
            HStack(spacing: Spacing.xxs) {
                Image(systemName: "globe")
                Text(languageManager.currentLanguage.displayName)
                    .font(.appBody)
            }
            .foregroundStyle(Color.appAccent)
        }
        .accessibilityLabel(L10n.language)
    }
}

#Preview("Signed In") {
    AccountView(authService: FirebaseAuthService())
        .environment(LanguageManager.shared)
}

#Preview("Guest") {
    AccountView(authService: FirebaseAuthService())
        .environment(LanguageManager.shared)
}
