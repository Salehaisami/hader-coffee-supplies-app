import Foundation
import Observation

/// OTP authentication state machine.
/// States: idle → sendingCode → codeSent → verifying → authenticated → profileSetup
enum AuthStep: Equatable {
    case phoneEntry
    case sendingCode
    case codeSent
    case verifying
    case authenticated
    case profileSetup
}

/// ViewModel managing the phone OTP sign-in flow.
@MainActor
@Observable
final class AuthViewModel {
    // MARK: - Published State

    var phoneNumber: String = ""
    var verificationCode: String = ""
    var step: AuthStep = .phoneEntry
    var errorMessage: String?
    var resendCountdown: Int = 0

    // Profile setup fields
    var businessName: String = ""
    var contactName: String = ""
    var email: String = ""

    // MARK: - Dependencies

    @ObservationIgnored private let authService: AuthServiceProtocol
    @ObservationIgnored private let firestoreService: FirestoreServiceProtocol?
    @ObservationIgnored private var verificationId: String?
    @ObservationIgnored private var resendTimer: Timer?
    @ObservationIgnored private var isNewUser: Bool = false
    @ObservationIgnored private var authenticatedUserId: String?

    /// Callback when authentication completes (user is signed in and profile is set up if needed).
    @ObservationIgnored var onAuthComplete: ((String) -> Void)?

    // MARK: - Constants

    static let resendInterval: Int = 30
    static let codeLength: Int = 6

    // MARK: - Init

    init(authService: AuthServiceProtocol, firestoreService: FirestoreServiceProtocol? = nil) {
        self.authService = authService
        self.firestoreService = firestoreService
    }

    deinit {
        resendTimer?.invalidate()
    }

    // MARK: - Actions

    /// Send OTP verification code to the entered phone number.
    func sendCode() async {
        guard canSendCode else {
            errorMessage = L10n.authPhoneRequired
            return
        }

        step = .sendingCode
        errorMessage = nil

        do {
            let id = try await authService.sendVerificationCode(to: formattedPhoneNumber)
            verificationId = id
            step = .codeSent
            startResendTimer()
        } catch {
            step = .phoneEntry
            errorMessage = error.localizedDescription
        }
    }

    /// Verify the OTP code entered by the user.
    func verifyCode() async {
        guard let verificationId,
              verificationCode.count == Self.codeLength else {
            errorMessage = L10n.authCodeInvalid
            return
        }

        step = .verifying
        errorMessage = nil

        do {
            let user = try await authService.verifyCode(verificationCode, verificationId: verificationId)
            authenticatedUserId = user.uid
            isNewUser = user.isNewUser
            stopResendTimer()

            if user.isNewUser {
                step = .profileSetup
            } else {
                step = .authenticated
                onAuthComplete?(user.uid)
            }
        } catch {
            step = .codeSent
            errorMessage = error.localizedDescription
        }
    }

    /// Resend the OTP code.
    func resendCode() async {
        guard resendCountdown == 0 else { return }
        await sendCode()
    }

    /// Complete profile setup for new users.
    func completeProfile() async {
        guard !businessName.isEmpty, !contactName.isEmpty else {
            errorMessage = L10n.authProfileIncomplete
            return
        }

        guard let userId = authenticatedUserId else { return }

        errorMessage = nil

        let user = AppUser(
            id: userId,
            businessName: businessName,
            contactName: contactName,
            phone: formattedPhoneNumber,
            email: email.isEmpty ? nil : email,
            role: .customer,
            status: .pending
        )

        do {
            try await firestoreService?.setDocument(
                collection: "users",
                documentId: userId,
                data: user
            )
            step = .authenticated
            onAuthComplete?(userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Reset the flow back to phone entry.
    func reset() {
        step = .phoneEntry
        phoneNumber = ""
        verificationCode = ""
        businessName = ""
        contactName = ""
        email = ""
        errorMessage = nil
        verificationId = nil
        isNewUser = false
        authenticatedUserId = nil
        stopResendTimer()
    }

    // MARK: - Computed

    var formattedPhoneNumber: String {
        let digits = phoneNumber.filter(\.isNumber)
        if digits.hasPrefix("966") {
            return "+\(digits)"
        } else if digits.hasPrefix("0") {
            return "+966\(digits.dropFirst())"
        } else if digits.hasPrefix("5") {
            return "+966\(digits)"
        }
        return "+966\(digits)"
    }

    var canSendCode: Bool {
        let digits = phoneNumber.filter(\.isNumber)
        // Saudi mobile: 9 digits starting with 50, 53, 54, 55, 56, 57, 58, 59
        guard digits.count == 9, digits.hasPrefix("5") else { return false }
        let prefix = String(digits.prefix(2))
        let validPrefixes: Set<String> = ["50", "53", "54", "55", "56", "57", "58", "59"]
        return validPrefixes.contains(prefix) && step == .phoneEntry
    }

    var canVerify: Bool {
        verificationCode.count == Self.codeLength && step == .codeSent
    }

    var canCompleteProfile: Bool {
        !businessName.isEmpty && !contactName.isEmpty
    }

    var resendAvailable: Bool {
        resendCountdown == 0 && step == .codeSent
    }

    // MARK: - Timer

    private func startResendTimer() {
        resendCountdown = Self.resendInterval
        resendTimer?.invalidate()
        resendTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            Task { @MainActor [weak self] in
                guard let self else {
                    timer.invalidate()
                    return
                }
                if self.resendCountdown > 0 {
                    self.resendCountdown -= 1
                } else {
                    timer.invalidate()
                }
            }
        }
    }

    private func stopResendTimer() {
        resendTimer?.invalidate()
        resendTimer = nil
        resendCountdown = 0
    }
}
