import SwiftUI

/// Root view that decides between onboarding (first launch) and the main tab content.
/// Logged-in users and returning users skip onboarding.
struct RootView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding: Bool = false

    var body: some View {
        if hasCompletedOnboarding {
            ContentView()
        } else {
            OnboardingView {
                withAnimation {
                    hasCompletedOnboarding = true
                }
            }
        }
    }
}

#Preview("First Launch") {
    RootView()
        .environment(LanguageManager.shared)
}
