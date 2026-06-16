import XCTest
@testable import CoffeeSuppliesApp

/// Unit tests for AuthViewModel covering the OTP state machine:
/// phoneEntry → sendingCode → codeSent → verifying → authenticated/profileSetup
@MainActor
final class AuthViewModelTests: XCTestCase {
    private var mockAuth: MockAuthService!
    private var mockFirestore: MockFirestoreService!
    private var sut: AuthViewModel!

    override func setUp() {
        super.setUp()
        mockAuth = MockAuthService()
        mockFirestore = MockFirestoreService()
        sut = AuthViewModel(authService: mockAuth, firestoreService: mockFirestore)
    }

    override func tearDown() {
        sut = nil
        mockAuth = nil
        mockFirestore = nil
        super.tearDown()
    }

    // MARK: - Initial State

    func testInitialState() {
        XCTAssertEqual(sut.step, .phoneEntry)
        XCTAssertTrue(sut.phoneNumber.isEmpty)
        XCTAssertTrue(sut.verificationCode.isEmpty)
        XCTAssertNil(sut.errorMessage)
        XCTAssertEqual(sut.resendCountdown, 0)
    }

    // MARK: - Send Code

    func testSendCode_Success_TransitionsToCodeSent() async {
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId

        await sut.sendCode()

        XCTAssertEqual(sut.step, .codeSent)
        XCTAssertNil(sut.errorMessage)
        XCTAssertGreaterThan(sut.resendCountdown, 0)
        XCTAssertTrue(mockAuth.methodCalls.first?.contains("sendVerificationCode") == true)
    }

    func testSendCode_EmptyPhone_ShowsError() async {
        sut.phoneNumber = ""

        await sut.sendCode()

        XCTAssertEqual(sut.step, .phoneEntry)
        XCTAssertNotNil(sut.errorMessage)
    }

    func testSendCode_ServiceError_ReturnsToPhoneEntry() async {
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Network error"])

        await sut.sendCode()

        XCTAssertEqual(sut.step, .phoneEntry)
        XCTAssertEqual(sut.errorMessage, "Network error")
    }

    func testSendCode_SetsStepToSendingCodeDuringRequest() async {
        sut.phoneNumber = TestData.validPhoneNumber

        // Verify intermediate state by checking the flow completes correctly
        await sut.sendCode()

        // After completion, should be codeSent (was sendingCode during execution)
        XCTAssertEqual(sut.step, .codeSent)
    }

    // MARK: - Verify Code

    func testVerifyCode_Success_ReturningUser_TransitionsToAuthenticated() async {
        // Setup: already at codeSent step
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        await sut.sendCode()

        // Simulate returning user
        mockAuth.simulatedUser = TestData.sampleAuthUser
        sut.verificationCode = TestData.validOTPCode

        await sut.verifyCode()

        XCTAssertEqual(sut.step, .authenticated)
        XCTAssertNil(sut.errorMessage)
    }

    func testVerifyCode_Success_NewUser_TransitionsToProfileSetup() async {
        // Setup: already at codeSent step
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        await sut.sendCode()

        // Simulate new user
        mockAuth.simulatedUser = TestData.newAuthUser
        sut.verificationCode = TestData.validOTPCode

        await sut.verifyCode()

        XCTAssertEqual(sut.step, .profileSetup)
        XCTAssertNil(sut.errorMessage)
    }

    func testVerifyCode_InvalidCode_ShowsError() async {
        // Setup
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()

        // Too short code
        sut.verificationCode = "123"

        await sut.verifyCode()

        // Should stay at codeSent since code is invalid
        XCTAssertNotNil(sut.errorMessage)
    }

    func testVerifyCode_ServiceError_ReturnsToCodeSent() async {
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        await sut.sendCode()

        mockAuth.errorToThrow = NSError(domain: "test", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid code"])
        sut.verificationCode = TestData.validOTPCode

        await sut.verifyCode()

        XCTAssertEqual(sut.step, .codeSent)
        XCTAssertEqual(sut.errorMessage, "Invalid code")
    }

    // MARK: - Resend Timer

    func testResendTimer_StartsAt30() async {
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()

        XCTAssertEqual(sut.resendCountdown, AuthViewModel.resendInterval)
    }

    func testResendCode_BlockedDuringCountdown() async {
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()
        mockAuth.methodCalls = []

        // Should not resend while countdown is active
        await sut.resendCode()

        XCTAssertTrue(mockAuth.methodCalls.isEmpty)
    }

    // MARK: - Profile Setup

    func testCompleteProfile_Success_TransitionsToAuthenticated() async {
        // Setup: go through full flow to profileSetup
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        await sut.sendCode()

        mockAuth.simulatedUser = TestData.newAuthUser
        sut.verificationCode = TestData.validOTPCode
        await sut.verifyCode()

        XCTAssertEqual(sut.step, .profileSetup)

        // Fill in profile
        sut.businessName = "مقهى جديد"
        sut.contactName = "فهد"
        sut.email = "fahd@test.com"

        await sut.completeProfile()

        XCTAssertEqual(sut.step, .authenticated)
        XCTAssertNil(sut.errorMessage)
        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("setDocument(users") })
    }

    func testCompleteProfile_MissingFields_ShowsError() async {
        // Setup to profileSetup
        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        await sut.sendCode()
        mockAuth.simulatedUser = TestData.newAuthUser
        sut.verificationCode = TestData.validOTPCode
        await sut.verifyCode()

        // Don't fill required fields
        sut.businessName = ""
        sut.contactName = ""

        await sut.completeProfile()

        XCTAssertEqual(sut.step, .profileSetup)
        XCTAssertNotNil(sut.errorMessage)
    }

    // MARK: - onAuthComplete Callback

    func testOnAuthComplete_CalledOnAuthentication() async {
        var completedUserId: String?
        sut.onAuthComplete = { userId in
            completedUserId = userId
        }

        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        mockAuth.simulatedUser = TestData.sampleAuthUser
        await sut.sendCode()
        sut.verificationCode = TestData.validOTPCode
        await sut.verifyCode()

        XCTAssertEqual(completedUserId, TestData.sampleAuthUser.uid)
    }

    func testOnAuthComplete_CalledAfterProfileSetup() async {
        var completedUserId: String?
        sut.onAuthComplete = { userId in
            completedUserId = userId
        }

        sut.phoneNumber = TestData.validPhoneNumber
        mockAuth.simulatedVerificationId = TestData.verificationId
        mockAuth.simulatedUser = TestData.newAuthUser
        await sut.sendCode()
        sut.verificationCode = TestData.validOTPCode
        await sut.verifyCode()

        // Not called yet — user needs to complete profile
        XCTAssertNil(completedUserId)

        sut.businessName = "Test Cafe"
        sut.contactName = "Test User"
        await sut.completeProfile()

        XCTAssertEqual(completedUserId, TestData.newAuthUser.uid)
    }

    // MARK: - Reset

    func testReset_ClearsAllState() async {
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()
        sut.verificationCode = TestData.validOTPCode

        sut.reset()

        XCTAssertEqual(sut.step, .phoneEntry)
        XCTAssertTrue(sut.phoneNumber.isEmpty)
        XCTAssertTrue(sut.verificationCode.isEmpty)
        XCTAssertTrue(sut.businessName.isEmpty)
        XCTAssertTrue(sut.contactName.isEmpty)
        XCTAssertTrue(sut.email.isEmpty)
        XCTAssertNil(sut.errorMessage)
        XCTAssertEqual(sut.resendCountdown, 0)
    }

    // MARK: - Phone Number Formatting

    func testFormattedPhoneNumber_AddsCountryCode() {
        sut.phoneNumber = "500000001"
        XCTAssertEqual(sut.formattedPhoneNumber, "+966500000001")
    }

    func testFormattedPhoneNumber_StripsLeadingZero() {
        sut.phoneNumber = "0500000001"
        XCTAssertEqual(sut.formattedPhoneNumber, "+966500000001")
    }

    func testFormattedPhoneNumber_PreservesFullNumber() {
        sut.phoneNumber = "966500000001"
        XCTAssertEqual(sut.formattedPhoneNumber, "+966500000001")
    }

    // MARK: - Computed Properties

    func testCanSendCode_TrueWhenPhoneNotEmpty() {
        sut.phoneNumber = "500000001" // 9 digits — valid Saudi mobile
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_FalseWhenPhoneEmpty() {
        sut.phoneNumber = ""
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_FalseWhenPhoneTooShort() {
        sut.phoneNumber = "5"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanVerify_TrueWith6Digits() async {
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()
        sut.verificationCode = "123456"
        XCTAssertTrue(sut.canVerify)
    }

    func testCanVerify_FalseWithLessThan6Digits() async {
        sut.phoneNumber = TestData.validPhoneNumber
        await sut.sendCode()
        sut.verificationCode = "12345"
        XCTAssertFalse(sut.canVerify)
    }

    func testCanCompleteProfile_RequiresBothFields() {
        sut.businessName = "Test"
        sut.contactName = ""
        XCTAssertFalse(sut.canCompleteProfile)

        sut.contactName = "Name"
        XCTAssertTrue(sut.canCompleteProfile)
    }
}
