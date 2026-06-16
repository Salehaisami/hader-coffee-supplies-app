import Testing
@testable import CoffeeSuppliesApp

@Suite("MockFirestoreService Tests")
struct MockFirestoreServiceTests {
    let firestore = MockFirestoreService()

    @Test("Set and get document round-trips correctly")
    func setAndGet() async throws {
        let user = TestData.customerUser
        try await firestore.setDocument(collection: "users", documentId: user.id, data: user)

        let retrieved: AppUser = try await firestore.getDocument(collection: "users", documentId: user.id)
        #expect(retrieved.id == user.id)
        #expect(retrieved.businessName == user.businessName)
        #expect(retrieved.phone == user.phone)
    }

    @Test("Get non-existent document throws error")
    func getNotFound() async {
        do {
            let _: AppUser = try await firestore.getDocument(collection: "users", documentId: "nonexistent")
            Issue.record("Expected error to be thrown")
        } catch {
            #expect(error is MockFirestoreError)
        }
    }

    @Test("Add document generates unique ID")
    func addDocument() async throws {
        let product = TestData.paperCupHot
        let id1 = try await firestore.addDocument(collection: "products", data: product)
        let id2 = try await firestore.addDocument(collection: "products", data: product)
        #expect(id1 != id2)
    }

    @Test("Delete document removes it from store")
    func deleteDocument() async throws {
        let user = TestData.customerUser
        try await firestore.setDocument(collection: "users", documentId: user.id, data: user)
        try await firestore.deleteDocument(collection: "users", documentId: user.id)

        do {
            let _: AppUser = try await firestore.getDocument(collection: "users", documentId: user.id)
            Issue.record("Expected error after deletion")
        } catch {
            #expect(error is MockFirestoreError)
        }
    }

    @Test("Error injection works")
    func errorInjection() async {
        firestore.errorToThrow = MockFirestoreError.documentNotFound
        do {
            let _: AppUser = try await firestore.getDocument(collection: "users", documentId: "any")
            Issue.record("Expected error to be thrown")
        } catch {
            #expect(error is MockFirestoreError)
        }
    }

    @Test("Method calls are tracked")
    func methodTracking() async throws {
        let user = TestData.customerUser
        try await firestore.setDocument(collection: "users", documentId: user.id, data: user)
        let _: AppUser = try await firestore.getDocument(collection: "users", documentId: user.id)

        #expect(firestore.methodCalls.count == 2)
        #expect(firestore.methodCalls[0].contains("setDocument"))
        #expect(firestore.methodCalls[1].contains("getDocument"))
    }
}
