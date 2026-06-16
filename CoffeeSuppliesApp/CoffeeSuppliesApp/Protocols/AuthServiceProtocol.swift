import Foundation

/// Represents the current authentication state.
enum AuthState: Equatable {
    case signedOut
    case verifyingPhone
    case signedIn(userId: String)
}

/// User profile information after authentication.
struct AuthUser: Equatable {
    let uid: String
    let phoneNumber: String?
    let isNewUser: Bool
}

/// Protocol wrapping Firebase Auth operations for testability.
protocol AuthServiceProtocol {
    /// Current authentication state.
    var currentState: AuthState { get }

    /// Currently signed-in user, or nil.
    var currentUser: AuthUser? { get }

    /// Send a verification code to the given phone number.
    /// Returns a verification ID for use in `verifyCode`.
    func sendVerificationCode(to phoneNumber: String) async throws -> String

    /// Verify the OTP code against the verification ID.
    /// Returns the authenticated user info.
    func verifyCode(_ code: String, verificationId: String) async throws -> AuthUser

    /// Sign out the current user.
    func signOut() throws

    /// Listen for auth state changes.
    func addStateListener(_ listener: @escaping (AuthState) -> Void) -> Any
}
