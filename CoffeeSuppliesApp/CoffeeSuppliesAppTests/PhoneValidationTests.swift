import XCTest
@testable import CoffeeSuppliesApp

/// Tests for Saudi phone number validation in AuthViewModel.canSendCode.
@MainActor
final class PhoneValidationTests: XCTestCase {
    private var sut: AuthViewModel!
    private var mockAuth: MockAuthService!

    override func setUp() {
        super.setUp()
        mockAuth = MockAuthService()
        sut = AuthViewModel(authService: mockAuth)
    }

    // MARK: - Valid Prefixes

    func testCanSendCode_ValidPrefix50() {
        sut.phoneNumber = "501234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix53() {
        sut.phoneNumber = "531234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix54() {
        sut.phoneNumber = "541234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix55() {
        sut.phoneNumber = "551234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix56() {
        sut.phoneNumber = "561234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix57() {
        sut.phoneNumber = "571234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix58() {
        sut.phoneNumber = "581234567"
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_ValidPrefix59() {
        sut.phoneNumber = "591234567"
        XCTAssertTrue(sut.canSendCode)
    }

    // MARK: - Invalid Prefixes

    func testCanSendCode_InvalidPrefix51() {
        sut.phoneNumber = "511234567"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_InvalidPrefix52() {
        sut.phoneNumber = "521234567"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_InvalidPrefix60() {
        sut.phoneNumber = "601234567"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_InvalidPrefix1() {
        sut.phoneNumber = "112345678"
        XCTAssertFalse(sut.canSendCode)
    }

    // MARK: - Length Validation

    func testCanSendCode_TooShort_8Digits() {
        sut.phoneNumber = "55123456"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_TooLong_10Digits() {
        sut.phoneNumber = "5512345678"
        XCTAssertFalse(sut.canSendCode)
    }

    func testCanSendCode_Exact9Digits() {
        sut.phoneNumber = "551234567"
        XCTAssertTrue(sut.canSendCode)
    }

    // MARK: - Edge Cases

    func testCanSendCode_WithSpaces_StillValidates() {
        sut.phoneNumber = "55 123 4567"
        // Digits only: "551234567" — 9 digits, valid prefix
        XCTAssertTrue(sut.canSendCode)
    }

    func testCanSendCode_FalseWhileSendingCode() {
        sut.phoneNumber = "551234567"
        sut.step = .sendingCode
        XCTAssertFalse(sut.canSendCode, "Should not allow send while already sending")
    }
}
