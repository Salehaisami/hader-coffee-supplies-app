import Foundation
import FirebaseAuth

/// Production Firebase Auth service implementation.
final class FirebaseAuthService: AuthServiceProtocol {
    private let auth = Auth.auth()

    var currentState: AuthState {
        if let user = auth.currentUser {
            return .signedIn(userId: user.uid)
        }
        return .signedOut
    }

    var currentUser: AuthUser? {
        guard let user = auth.currentUser else { return nil }
        return AuthUser(uid: user.uid, phoneNumber: user.phoneNumber, isNewUser: false)
    }

    func sendVerificationCode(to phoneNumber: String) async throws -> String {
        let verificationId = try await PhoneAuthProvider.provider()
            .verifyPhoneNumber(phoneNumber, uiDelegate: nil)
        return verificationId
    }

    func verifyCode(_ code: String, verificationId: String) async throws -> AuthUser {
        let credential = PhoneAuthProvider.provider()
            .credential(withVerificationID: verificationId, verificationCode: code)
        let result = try await auth.signIn(with: credential)
        let isNew = result.additionalUserInfo?.isNewUser ?? false
        return AuthUser(
            uid: result.user.uid,
            phoneNumber: result.user.phoneNumber,
            isNewUser: isNew
        )
    }

    func signOut() throws {
        try auth.signOut()
    }

    func addStateListener(_ listener: @escaping (AuthState) -> Void) -> Any {
        return auth.addStateDidChangeListener { _, user in
            if let user {
                listener(.signedIn(userId: user.uid))
            } else {
                listener(.signedOut)
            }
        }
    }
}
