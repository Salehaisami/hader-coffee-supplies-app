import SwiftUI

/// Onboarding page data.
struct OnboardingPage: Identifiable {
    let id: Int
    let icon: String
    let title: String
    let body: String
}

/// 2-3 swipeable onboarding screens shown once per install.
/// Skippable. Logged-in users skip entirely.
struct OnboardingView: View {
    @State private var currentPage: Int = 0
    let onComplete: () -> Void

    private let pages: [OnboardingPage] = [
        OnboardingPage(id: 0, icon: "cup.and.saucer", title: L10n.onboardingTitle1, body: L10n.onboardingBody1),
        OnboardingPage(id: 1, icon: "hand.tap", title: L10n.onboardingTitle2, body: L10n.onboardingBody2),
        OnboardingPage(id: 2, icon: "shippingbox", title: L10n.onboardingTitle3, body: L10n.onboardingBody3),
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Skip button
            HStack {
                Spacer()
                if currentPage < pages.count - 1 {
                    Button(L10n.onboardingSkip) {
                        onComplete()
                    }
                    .font(.appSubheadline)
                    .foregroundStyle(Color.secondaryText)
                    .padding(.trailing, Spacing.lg)
                    .padding(.top, Spacing.sm)
                    .accessibilityLabel(L10n.onboardingSkip)
                }
            }

            // Page content
            TabView(selection: $currentPage) {
                ForEach(pages) { page in
                    OnboardingPageView(page: page)
                        .tag(page.id)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentPage)

            // Page indicator + action button
            VStack(spacing: Spacing.lg) {
                // Dots
                HStack(spacing: Spacing.xxs) {
                    ForEach(pages) { page in
                        Circle()
                            .fill(page.id == currentPage ? Color.appAccent : Color.stone200)
                            .frame(width: 8, height: 8)
                            .animation(.easeInOut(duration: 0.2), value: currentPage)
                    }
                }

                // Action button
                if currentPage == pages.count - 1 {
                    PrimaryButton(L10n.onboardingGetStarted) {
                        onComplete()
                    }
                    .padding(.horizontal, Spacing.xl)
                } else {
                    PrimaryButton(L10n.onboardingNext) {
                        withAnimation {
                            currentPage += 1
                        }
                    }
                    .padding(.horizontal, Spacing.xl)
                }
            }
            .padding(.bottom, Spacing.xxxl)
        }
        .background(Color.appBackground)
    }
}

/// Single onboarding page with icon, title, and body text.
private struct OnboardingPageView: View {
    let page: OnboardingPage

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()

            Image(systemName: page.icon)
                .font(.system(size: 64))
                .foregroundStyle(Color.appAccent)

            VStack(spacing: Spacing.xs) {
                Text(page.title)
                    .font(.appTitle2)
                    .foregroundStyle(Color.primaryText)
                    .multilineTextAlignment(.center)

                Text(page.body)
                    .font(.appBody)
                    .foregroundStyle(Color.secondaryText)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }
            .padding(.horizontal, Spacing.xl)

            Spacer()
            Spacer()
        }
    }
}

#Preview {
    OnboardingView(onComplete: {})
        .environment(LanguageManager.shared)
}
