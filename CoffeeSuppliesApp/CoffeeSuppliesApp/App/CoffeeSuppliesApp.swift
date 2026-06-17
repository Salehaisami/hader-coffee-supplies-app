import SwiftUI

@main
struct CoffeeSuppliesApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @State private var languageManager = LanguageManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.layoutDirection, languageManager.layoutDirection)
                .environment(\.locale, languageManager.locale)
                .environment(languageManager)
                .preferredColorScheme(.light)
        }
    }
}
