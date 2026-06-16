import Foundation

/// Category document model matching Firestore schema.
struct Category: Codable, Identifiable, Equatable {
    let id: String
    let nameAr: String
    let nameEn: String
    let sortOrder: Int
    let iconUrl: String?

    /// Resolved name based on current language.
    var localizedName: String {
        LanguageManager.shared.resolve(ar: nameAr, en: nameEn)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case nameAr = "name_ar"
        case nameEn = "name_en"
        case sortOrder
        case iconUrl
    }
}
