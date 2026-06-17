import SwiftUI
import FirebaseCore

@main
struct CoffeeSuppliesApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @State private var languageManager = LanguageManager.shared

    init() {
        // Use environment-specific plist if available, otherwise default
        #if DEBUG
        if let path = Bundle.main.path(forResource: "GoogleService-Info-Dev", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
        } else {
            FirebaseApp.configure()
        }
        #else
        if let path = Bundle.main.path(forResource: "GoogleService-Info-Prod", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
        } else {
            FirebaseApp.configure()
        }
        #endif
    }

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
