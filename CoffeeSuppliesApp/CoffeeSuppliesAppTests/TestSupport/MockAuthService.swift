import Foundation
@testable import CoffeeSuppliesApp

/// Mock auth service for unit testing.
final class MockAuthService: AuthServiceProtocol {
    var currentState: AuthState = .signedOut
    var currentUser: AuthUser?

    /// Track method calls for verification.
    var methodCalls: [String] = []

    /// Error to throw on next call.
    var errorToThrow: Error?

    /// Simulated verification ID returned by sendVerificationCode.
    var simulatedVerificationId = "mock-verification-id"

    /// Simulated user returned by verifyCode.
    var simulatedUser = AuthUser(uid: "mock-uid", phoneNumber: "+966500000000", isNewUser: true)

    /// State change listeners.
    private var listeners: [(AuthState) -> Void] = []

    func sendVerificationCode(to phoneNumber: String) async throws -> String {
        methodCalls.append("sendVerificationCode(\(phoneNumber))")
        if let error = errorToThrow { throw error }
        currentState = .verifyingPhone
        notifyListeners()
        return simulatedVerificationId
    }

    func verifyCode(_ code: String, verificationId: String) async throws -> AuthUser {
        methodCalls.append("verifyCode(\(code), \(verificationId))")
        if let error = errorToThrow { throw error }
        currentUser = simulatedUser
        currentState = .signedIn(userId: simulatedUser.uid)
        notifyListeners()
        return simulatedUser
    }

    func signOut() throws {
        methodCalls.append("signOut")
        if let error = errorToThrow { throw error }
        currentUser = nil
        currentState = .signedOut
        notifyListeners()
    }

    func addStateListener(_ listener: @escaping (AuthState) -> Void) -> Any {
        listeners.append(listener)
        listener(currentState)
        return listeners.count - 1
    }

    // MARK: - Helpers

    private func notifyListeners() {
        listeners.forEach { $0(currentState) }
    }

    func reset() {
        currentState = .signedOut
        currentUser = nil
        methodCalls = []
        errorToThrow = nil
        listeners = []
    }
}
