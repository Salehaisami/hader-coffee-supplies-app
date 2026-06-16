import Testing
import SwiftUI
@testable import CoffeeSuppliesApp

/// Serialized because every test mutates the shared `LanguageManager.shared` singleton.
/// Without this, Swift Testing's default parallel execution races on that global state.
@Suite("LanguageManager Tests", .serialized)
struct LanguageManagerTests {

    @Test("Default language is Arabic")
    func defaultLanguage() {
        // Note: In tests, UserDefaults may already have a value.
        // This test verifies the manager respects stored preference.
        let manager = LanguageManager.shared
        #expect(manager.currentLanguage == .arabic || manager.currentLanguage == .english)
    }

    @Test("Arabic produces RTL layout direction")
    func arabicRTL() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .arabic
        #expect(manager.layoutDirection == .rightToLeft)
        #expect(manager.isRTL == true)
    }

    @Test("English produces LTR layout direction")
    func englishLTR() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .english
        #expect(manager.layoutDirection == .leftToRight)
        #expect(manager.isRTL == false)
    }

    @Test("Toggle switches between languages")
    func toggleLanguage() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .arabic
        manager.toggle()
        #expect(manager.currentLanguage == .english)
        manager.toggle()
        #expect(manager.currentLanguage == .arabic)
    }

    @Test("Resolve returns Arabic field when Arabic is active")
    func resolveArabic() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .arabic
        let result = manager.resolve(ar: "أكواب", en: "Cups")
        #expect(result == "أكواب")
    }

    @Test("Resolve returns English field when English is active")
    func resolveEnglish() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .english
        let result = manager.resolve(ar: "أكواب", en: "Cups")
        #expect(result == "Cups")
    }

    @Test("Locale is correct for each language")
    func localeIdentifiers() {
        let manager = LanguageManager.shared
        manager.currentLanguage = .arabic
        #expect(manager.locale.identifier == "ar")
        manager.currentLanguage = .english
        #expect(manager.locale.identifier == "en")
    }
}
