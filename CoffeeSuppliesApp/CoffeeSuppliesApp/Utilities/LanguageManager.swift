import SwiftUI
import Observation

/// Manages app language and layout direction.
/// Arabic is the default; English is secondary. Toggle stored in UserDefaults.
@Observable
final class LanguageManager {
    static let shared = LanguageManager()

    enum Language: String, CaseIterable {
        case arabic = "ar"
        case english = "en"

        var displayName: String {
            switch self {
            case .arabic: return "العربية"
            case .english: return "English"
            }
        }
    }

    @ObservationIgnored private static let storageKey = "app_language"

    var currentLanguage: Language {
        didSet {
            UserDefaults.standard.set(currentLanguage.rawValue, forKey: Self.storageKey)
        }
    }

    var layoutDirection: LayoutDirection {
        currentLanguage == .arabic ? .rightToLeft : .leftToRight
    }

    var locale: Locale {
        Locale(identifier: currentLanguage.rawValue)
    }

    var isRTL: Bool {
        currentLanguage == .arabic
    }

    private init() {
        let stored = UserDefaults.standard.string(forKey: Self.storageKey) ?? Language.arabic.rawValue
        self.currentLanguage = Language(rawValue: stored) ?? .arabic
    }

    func toggle() {
        currentLanguage = currentLanguage == .arabic ? .english : .arabic
    }

    /// Resolves a bilingual field pair based on current language.
    func resolve(ar: String, en: String) -> String {
        currentLanguage == .arabic ? ar : en
    }
}
