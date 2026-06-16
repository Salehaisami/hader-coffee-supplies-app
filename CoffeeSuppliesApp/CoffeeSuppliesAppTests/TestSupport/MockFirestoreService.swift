import Foundation
@testable import CoffeeSuppliesApp

/// Error type for mock Firestore operations.
enum MockFirestoreError: Error {
    case documentNotFound
}

/// Mock Firestore service for unit testing.
final class MockFirestoreService: FirestoreServiceProtocol {
    /// Track method calls for verification.
    var methodCalls: [String] = []

    /// Error to throw on next call.
    var errorToThrow: Error?

    /// In-memory document store: [collection: [docId: data]]
    var documents: [String: [String: Any]] = [:]

    /// Stored encodable documents for type-safe retrieval.
    private var encodedDocuments: [String: [String: Data]] = [:]

    func getDocument<T: Decodable>(collection: String, documentId: String) async throws -> T {
        methodCalls.append("getDocument(\(collection), \(documentId))")
        if let error = errorToThrow { throw error }

        guard let collectionData = encodedDocuments[collection],
              let data = collectionData[documentId] else {
            throw MockFirestoreError.documentNotFound
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970
        return try decoder.decode(T.self, from: data)
    }

    func getDocuments<T: Decodable>(collection: String) async throws -> [T] {
        methodCalls.append("getDocuments(\(collection))")
        if let error = errorToThrow { throw error }

        guard let collectionData = encodedDocuments[collection] else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970
        return collectionData.values.compactMap { data in
            try? decoder.decode(T.self, from: data)
        }
    }

    func getDocuments<T: Decodable>(
        collection: String,
        whereField field: String,
        isEqualTo value: Any
    ) async throws -> [T] {
        methodCalls.append("getDocuments(\(collection), \(field) == \(value))")
        if let error = errorToThrow { throw error }
        return []
    }

    func setDocument<T: Encodable>(collection: String, documentId: String, data: T) async throws {
        methodCalls.append("setDocument(\(collection), \(documentId))")
        if let error = errorToThrow { throw error }

        if encodedDocuments[collection] == nil {
            encodedDocuments[collection] = [:]
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        encodedDocuments[collection]?[documentId] = try encoder.encode(data)
    }

    @discardableResult
    func addDocument<T: Encodable>(collection: String, data: T) async throws -> String {
        let docId = UUID().uuidString
        methodCalls.append("addDocument(\(collection))")
        if let error = errorToThrow { throw error }

        if encodedDocuments[collection] == nil {
            encodedDocuments[collection] = [:]
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        encodedDocuments[collection]?[docId] = try encoder.encode(data)
        return docId
    }

    func updateDocument(collection: String, documentId: String, fields: [String: Any]) async throws {
        methodCalls.append("updateDocument(\(collection), \(documentId))")
        if let error = errorToThrow { throw error }
    }

    func deleteDocument(collection: String, documentId: String) async throws {
        methodCalls.append("deleteDocument(\(collection), \(documentId))")
        if let error = errorToThrow { throw error }
        encodedDocuments[collection]?.removeValue(forKey: documentId)
    }

    // MARK: - Helpers

    /// Store a pre-encoded document for retrieval.
    func seedDocument<T: Encodable>(_ document: T, collection: String, documentId: String) {
        if encodedDocuments[collection] == nil {
            encodedDocuments[collection] = [:]
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        encodedDocuments[collection]?[documentId] = try? encoder.encode(document)
    }

    func reset() {
        methodCalls = []
        errorToThrow = nil
        documents = [:]
        encodedDocuments = [:]
    }
}
