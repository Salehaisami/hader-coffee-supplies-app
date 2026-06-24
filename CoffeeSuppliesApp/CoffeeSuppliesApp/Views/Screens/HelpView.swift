import SwiftUI

/// Simple help/contact screen with support email and basic info.
struct HelpView: View {
    @Environment(LanguageManager.self) private var languageManager

    private var supportEmail: String { "support@haderapp.com" }
    private var privacyPolicyURL: URL? {
        URL(string: "https://salehaisami.github.io/hader-coffee-supplies-app/privacy-policy.html")
    }

    var body: some View {
        List {
            // Contact support
            Section {
                Link(destination: URL(string: "mailto:\(supportEmail)")!) {
                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "envelope")
                            .foregroundStyle(Color.appAccent)
                            .frame(width: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(helpContactTitle)
                                .font(.appBody)
                                .foregroundStyle(Color.primaryText)
                            Text(supportEmail)
                                .font(.appCaption)
                                .foregroundStyle(Color.secondaryText)
                        }
                        Spacer()
                        Image(systemName: "arrow.up.forward")
                            .font(.appCaption)
                            .foregroundStyle(Color.stone400)
                    }
                }
            } header: {
                Text(helpSectionSupport)
            }

            // Privacy policy
            Section {
                if let url = privacyPolicyURL {
                    Link(destination: url) {
                        HStack(spacing: Spacing.xs) {
                            Image(systemName: "lock.shield")
                                .foregroundStyle(Color.appAccent)
                                .frame(width: 24)
                            Text(helpPrivacyPolicy)
                                .font(.appBody)
                                .foregroundStyle(Color.primaryText)
                            Spacer()
                            Image(systemName: "arrow.up.forward")
                                .font(.appCaption)
                                .foregroundStyle(Color.stone400)
                        }
                    }
                }
            } header: {
                Text(helpSectionLegal)
            }

            // App version
            Section {
                HStack {
                    Text(helpAppVersion)
                        .font(.appBody)
                        .foregroundStyle(Color.primaryText)
                    Spacer()
                    Text(appVersion)
                        .font(.appMonoSmall)
                        .foregroundStyle(Color.secondaryText)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(helpTitle)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Localized Strings

    private var helpTitle: String {
        languageManager.resolve(ar: "المساعدة", en: "Help")
    }
    private var helpSectionSupport: String {
        languageManager.resolve(ar: "تواصل معنا", en: "Contact Us")
    }
    private var helpContactTitle: String {
        languageManager.resolve(ar: "إرسال بريد إلكتروني", en: "Send Email")
    }
    private var helpSectionLegal: String {
        languageManager.resolve(ar: "قانوني", en: "Legal")
    }
    private var helpPrivacyPolicy: String {
        languageManager.resolve(ar: "سياسة الخصوصية", en: "Privacy Policy")
    }
    private var helpAppVersion: String {
        languageManager.resolve(ar: "إصدار التطبيق", en: "App Version")
    }

    private var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}
