import SwiftUI

// MARK: - Typography Tokens

/// Typefaces:
/// - Fraunces: Editorial serif for display/headings (used with restraint)
/// - IBM Plex Sans Arabic: Clean body text with full Arabic support
/// - IBM Plex Mono: Prices/codes/data — "ledger" character
extension Font {
    // MARK: - Display / Headings (Fraunces)
    static let appLargeTitle = Font.custom("Fraunces-Regular", size: 34, relativeTo: .largeTitle)
    static let appTitle = Font.custom("Fraunces-Regular", size: 28, relativeTo: .title)
    static let appTitle2 = Font.custom("Fraunces-Regular", size: 22, relativeTo: .title2)

    // MARK: - Body (IBM Plex Sans Arabic)
    static let appHeadline = Font.custom("IBMPlexSansArabic-SemiBold", size: 17, relativeTo: .headline)
    static let appSubheadline = Font.custom("IBMPlexSansArabic-Regular", size: 15, relativeTo: .subheadline)
    static let appBody = Font.custom("IBMPlexSansArabic-Regular", size: 17, relativeTo: .body)
    static let appCaption = Font.custom("IBMPlexSansArabic-Regular", size: 12, relativeTo: .caption)

    // MARK: - Mono / Prices (IBM Plex Mono)
    static let appMonoPrice = Font.custom("IBMPlexMono-Medium", size: 16, relativeTo: .body)
    static let appMonoSmall = Font.custom("IBMPlexMono-Regular", size: 13, relativeTo: .caption)
}
