import Foundation

/// Supplier document model matching Firestore schema.
struct Supplier: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let phone: String
    let email: String
    let handlesNote: String
    let createdAt: Date?
}
