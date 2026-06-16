import Foundation
import FirebaseFirestore

/// Production Firestore service implementation.
final class FirebaseFirestoreService: FirestoreServiceProtocol {
    private let db: Firestore

    init() {
        let settings = FirestoreSettings()
        settings.isPersistenceEnabled = true
        settings.cacheSizeBytes = FirestoreCacheSizeUnlimited

        self.db = Firestore.firestore()
        self.db.settings = settings
    }

    func getDocument<T: Decodable>(collection: String, documentId: String) async throws -> T {
        let snapshot = try await db.collection(collection).document(documentId).getDocument()
        guard snapshot.exists else {
            throw FirestoreServiceError.documentNotFound
        }
        return try snapshot.data(as: T.self)
    }

    func getDocuments<T: Decodable>(collection: String) async throws -> [T] {
        let snapshot = try await db.collection(collection).getDocuments()
        return snapshot.documents.compactMap { doc in
            do {
                return try doc.data(as: T.self)
            } catch {
                print("⚠️ [Firestore] Failed to decode document \(doc.documentID) in '\(collection)': \(error.localizedDescription)")
                return nil
            }
        }
    }

    func getDocuments<T: Decodable>(
        collection: String,
        whereField field: String,
        isEqualTo value: Any
    ) async throws -> [T] {
        let snapshot = try await db.collection(collection)
            .whereField(field, isEqualTo: value)
            .getDocuments()
        return snapshot.documents.compactMap { doc in
            do {
                return try doc.data(as: T.self)
            } catch {
                print("⚠️ [Firestore] Failed to decode document \(doc.documentID) in '\(collection)': \(error.localizedDescription)")
                return nil
            }
        }
    }

    func setDocument<T: Encodable>(collection: String, documentId: String, data: T) async throws {
        try db.collection(collection).document(documentId).setData(from: data)
    }

    @discardableResult
    func addDocument<T: Encodable>(collection: String, data: T) async throws -> String {
        let ref = try db.collection(collection).addDocument(from: data)
        return ref.documentID
    }

    func updateDocument(collection: String, documentId: String, fields: [String: Any]) async throws {
        try await db.collection(collection).document(documentId).updateData(fields)
    }

    func deleteDocument(collection: String, documentId: String) async throws {
        try await db.collection(collection).document(documentId).delete()
    }
}

enum FirestoreServiceError: Error, LocalizedError {
    case documentNotFound

    var errorDescription: String? {
        switch self {
        case .documentNotFound: return "The requested document was not found."
        }
    }
}
