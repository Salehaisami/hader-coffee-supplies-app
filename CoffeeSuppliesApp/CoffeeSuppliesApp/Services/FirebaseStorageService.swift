import Foundation
import FirebaseStorage

/// Production Firebase Storage service implementation.
final class FirebaseStorageService: StorageServiceProtocol {
    private let storage = Storage.storage()

    func uploadData(_ data: Data, path: String, contentType: String) async throws -> URL {
        let ref = storage.reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = contentType

        _ = try await ref.putDataAsync(data, metadata: metadata)
        let url = try await ref.downloadURL()
        return url
    }

    func getDownloadURL(path: String) async throws -> URL {
        let ref = storage.reference().child(path)
        return try await ref.downloadURL()
    }

    func deleteFile(path: String) async throws {
        let ref = storage.reference().child(path)
        try await ref.delete()
    }
}
