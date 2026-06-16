import Foundation

// MARK: - Spacing & Shape Constants

/// Base-4 spacing scale.
enum Spacing {
    static let xxxs: CGFloat = 4
    static let xxs: CGFloat = 8
    static let xs: CGFloat = 12
    static let sm: CGFloat = 16
    static let md: CGFloat = 20
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 40
    static let xxxl: CGFloat = 48
}

/// Shape constants for the design system.
enum Shape {
    /// Standard card corner radius (14pt).
    static let cardRadius: CGFloat = 14

    /// Pill shape — use .infinity or a large value for capsule.
    static let pillRadius: CGFloat = 100

    /// Input field corner radius.
    static let inputRadius: CGFloat = 10

    /// Hairline border width (0.5pt).
    static let hairline: CGFloat = 0.5

    /// Standard border width.
    static let border: CGFloat = 1
}
