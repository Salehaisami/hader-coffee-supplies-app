import XCTest
@testable import CoffeeSuppliesApp

/// Unit tests for AccountViewModel: guest state, signed-in state, sign out.
@MainActor
final class AccountViewModelTests: XCTestCase {
    private var mockAuth: MockAuthService!
    private var mockFirestore: MockFirestoreService!
    private var sut: AccountViewModel!

    override func setUp() {
        super.setUp()
        mockAuth = MockAuthService()
        mockFirestore = MockFirestoreService()
        sut = AccountViewModel(authService: mockAuth, firestoreService: mockFirestore)
    }

    override func tearDown() {
        sut = nil
        mockAuth = nil
        mockFirestore = nil
        super.tearDown()
    }

    // MARK: - Initial State

    func testInitialState_SignedOut_ShowsGuest() {
        XCTAssertFalse(sut.isSignedIn)
        XCTAssertNil(sut.user)
        XCTAssertFalse(sut.showSignIn)
    }

    // MARK: - Sign Out

    func testSignOut_ClearsUserAndState() {
        // Simulate signed in state
        mockAuth.currentState = .signedIn(userId: TestData.sampleUser.id)
        sut.isSignedIn = true

        sut.signOut()

        XCTAssertFalse(sut.isSignedIn)
        XCTAssertNil(sut.user)
        XCTAssertTrue(mockAuth.methodCalls.contains("signOut"))
    }

    func testSignOut_Error_SetsErrorMessage() {
        mockAuth.errorToThrow = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Sign out failed"])
        sut.isSignedIn = true

        sut.signOut()

        XCTAssertEqual(sut.errorMessage, "Sign out failed")
    }

    // MARK: - Prompt Sign In

    func testPromptSignIn_SetsShowSignInTrue() {
        sut.promptSignIn()
        XCTAssertTrue(sut.showSignIn)
    }

    // MARK: - Auth Completed

    func testOnAuthCompleted_SetsSignedInAndDismissesSheet() {
        sut.showSignIn = true

        mockFirestore.seedDocument(TestData.sampleUser, collection: "users", documentId: TestData.sampleUser.id)

        sut.onAuthCompleted(userId: TestData.sampleUser.id)

        XCTAssertFalse(sut.showSignIn)
        XCTAssertTrue(sut.isSignedIn)
    }

    // MARK: - Fetch User

    func testFetchUser_LoadsUserFromFirestore() async {
        mockFirestore.seedDocument(TestData.sampleUser, collection: "users", documentId: TestData.sampleUser.id)

        await sut.fetchUser(userId: TestData.sampleUser.id)

        XCTAssertNotNil(sut.user)
        XCTAssertEqual(sut.user?.businessName, TestData.sampleUser.businessName)
        XCTAssertEqual(sut.user?.phone, TestData.sampleUser.phone)
        XCTAssertFalse(sut.isLoading)
    }

    func testFetchUser_DocumentNotFound_UserIsNil() async {
        mockFirestore.errorToThrow = FirestoreServiceError.documentNotFound

        await sut.fetchUser(userId: "nonexistent")

        XCTAssertNil(sut.user)
        XCTAssertFalse(sut.isLoading)
    }
}
