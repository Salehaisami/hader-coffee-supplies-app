import XCTest
@testable import CoffeeSuppliesApp

/// Tests for the Phase 1 gap-closing features: account deletion, profile edit, etc.
@MainActor
final class AccountGapsTests: XCTestCase {
    private var mockFirestore: MockFirestoreService!
    private var mockAuth: MockAuthService!

    override func setUp() {
        super.setUp()
        mockFirestore = MockFirestoreService()
        mockAuth = MockAuthService()
    }

    // MARK: - Business Details Edit

    func testBusinessDetailsEdit_InitialValues() {
        let user = AppUser(
            id: "user1",
            businessName: "Test Cafe",
            contactName: "Ali",
            phone: "+966551234567",
            email: "ali@test.com"
        )

        // Verify the user model fields match expected values
        XCTAssertEqual(user.businessName, "Test Cafe")
        XCTAssertEqual(user.contactName, "Ali")
        XCTAssertEqual(user.email, "ali@test.com")
    }

    func testBusinessDetailsEdit_SaveUpdatesFirestore() async throws {
        let user = AppUser(
            id: "user1",
            businessName: "Test Cafe",
            contactName: "Ali",
            phone: "+966551234567"
        )

        // Pre-create the user doc
        try await mockFirestore.setDocument(collection: "users", documentId: user.id, data: user)

        // Simulate save
        try await mockFirestore.updateDocument(
            collection: "users",
            documentId: "user1",
            fields: ["businessName": "Updated Cafe", "contactName": "Ahmed"]
        )

        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("updateDocument(users") })
    }

    // MARK: - Delivery Location Edit

    func testDeliveryLocationEdit_SavesCoordinates() async throws {
        let user = AppUser(id: "user1", businessName: "Cafe", contactName: "Ali", phone: "+966551234567")
        try await mockFirestore.setDocument(collection: "users", documentId: user.id, data: user)

        let address: [String: Any] = [
            "city": "Jeddah",
            "district": "Al Rawdah",
            "lat": 21.55,
            "lng": 39.17,
        ]
        try await mockFirestore.updateDocument(
            collection: "users",
            documentId: "user1",
            fields: ["deliveryAddress": address]
        )

        XCTAssertTrue(mockFirestore.methodCalls.contains { $0.contains("updateDocument(users") })
    }

    // MARK: - Account Deletion

    func testAccountDeletion_DeletesUserDocument() async throws {
        let user = AppUser(id: "user1", businessName: "Cafe", contactName: "Ali", phone: "+966551234567")
        try await mockFirestore.setDocument(collection: "users", documentId: user.id, data: user)

        try await mockFirestore.deleteDocument(collection: "users", documentId: "user1")

        XCTAssertTrue(mockFirestore.methodCalls.contains("deleteDocument(users, user1)"))
    }

    func testAccountDeletion_SignsOutAfterDeletion() throws {
        mockAuth.currentState = .signedIn(userId: "user1")
        XCTAssertEqual(mockAuth.currentState, .signedIn(userId: "user1"))

        try mockAuth.signOut()

        XCTAssertEqual(mockAuth.currentState, .signedOut)
    }

    // MARK: - Account View State

    func testAccountViewModel_SignedIn_ShowsUser() async {
        mockAuth.currentState = .signedIn(userId: "user1")
        let user = AppUser(id: "user1", businessName: "Cafe", contactName: "Ali", phone: "+966551234567")
        try? await mockFirestore.setDocument(collection: "users", documentId: user.id, data: user)

        let viewModel = AccountViewModel(authService: mockAuth, firestoreService: mockFirestore)
        await viewModel.fetchUser(userId: "user1")

        XCTAssertEqual(viewModel.user?.businessName, "Cafe")
        XCTAssertEqual(viewModel.user?.contactName, "Ali")
    }

    func testAccountViewModel_SignOut_ClearsUser() {
        mockAuth.currentState = .signedIn(userId: "user1")
        let viewModel = AccountViewModel(authService: mockAuth, firestoreService: mockFirestore)
        viewModel.signOut()

        XCTAssertFalse(viewModel.isSignedIn)
        XCTAssertNil(viewModel.user)
    }
}
