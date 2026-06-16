import Foundation

/// Protocol wrapping Firestore operations for testability.
protocol FirestoreServiceProtocol {
    /// Fetch a single document by ID, decoded to the given type.
    func getDocument<T: Decodable>(collection: String, documentId: String) async throws -> T

    /// Fetch all documents in a collection.
    func getDocuments<T: Decodable>(collection: String) async throws -> [T]

    /// Fetch documents matching a where clause.
    func getDocuments<T: Decodable>(
        collection: String,
        whereField field: String,
        isEqualTo value: Any
    ) async throws -> [T]

    /// Set (create or overwrite) a document.
    func setDocument<T: Encodable>(collection: String, documentId: String, data: T) async throws

    /// Add a new document with auto-generated ID.
    @discardableResult
    func addDocument<T: Encodable>(collection: String, data: T) async throws -> String

    /// Update specific fields on an existing document.
    func updateDocument(collection: String, documentId: String, fields: [String: Any]) async throws

    /// Delete a document.
    func deleteDocument(collection: String, documentId: String) async throws
}
