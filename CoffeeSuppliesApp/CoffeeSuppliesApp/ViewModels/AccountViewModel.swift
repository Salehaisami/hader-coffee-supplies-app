import Foundation
import Observation

/// ViewModel for the Account tab.
/// Handles signed-in vs guest state, user profile display, and sign out.
@MainActor
@Observable
final class AccountViewModel {
    // MARK: - Published State

    var isSignedIn: Bool = false
    var user: AppUser?
    var isLoading: Bool = false
    var errorMessage: String?
    var showSignIn: Bool = false

    // MARK: - Dependencies

    @ObservationIgnored private let authService: AuthServiceProtocol
    @ObservationIgnored private let firestoreService: FirestoreServiceProtocol?
    @ObservationIgnored private var authStateHandle: Any?

    // MARK: - Init

    init(authService: AuthServiceProtocol, firestoreService: FirestoreServiceProtocol? = nil) {
        self.authService = authService
        self.firestoreService = firestoreService
        observeAuthState()
    }

    // MARK: - Auth State Observation

    private func observeAuthState() {
        authStateHandle = authService.addStateListener { [weak self] state in
            Task { @MainActor [weak self] in
                guard let self else { return }
                switch state {
                case .signedIn(let userId):
                    self.isSignedIn = true
                    await self.fetchUser(userId: userId)
                case .signedOut, .verifyingPhone:
                    self.isSignedIn = false
                    self.user = nil
                }
            }
        }
    }

    // MARK: - Actions

    func fetchUser(userId: String) async {
        guard let firestoreService else { return }
        isLoading = true
        do {
            let appUser: AppUser = try await firestoreService.getDocument(
                collection: "users",
                documentId: userId
            )
            self.user = appUser
        } catch {
            // User doc may not exist yet (new user still in profile setup)
            self.user = nil
        }
        isLoading = false
    }

    func signOut() {
        do {
            try authService.signOut()
            user = nil
            isSignedIn = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func promptSignIn() {
        showSignIn = true
    }

    func onAuthCompleted(userId: String) {
        showSignIn = false
        isSignedIn = true
        Task {
            await fetchUser(userId: userId)
        }
    }
}
