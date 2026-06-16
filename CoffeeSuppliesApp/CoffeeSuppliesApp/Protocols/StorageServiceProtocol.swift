import Foundation

/// Protocol wrapping Firebase Storage operations for testability.
protocol StorageServiceProtocol {
    /// Upload data to a path and return the download URL.
    func uploadData(_ data: Data, path: String, contentType: String) async throws -> URL

    /// Get the download URL for an existing file at path.
    func getDownloadURL(path: String) async throws -> URL

    /// Delete a file at the given path.
    func deleteFile(path: String) async throws
}
