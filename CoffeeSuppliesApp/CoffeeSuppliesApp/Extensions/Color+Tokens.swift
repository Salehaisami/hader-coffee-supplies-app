import SwiftUI

// MARK: - Color Tokens

extension Color {
    // MARK: Stone palette (warm grey neutrals)
    static let stone50 = Color(hex: "F6F4F1")   // App background
    static let stone100 = Color(hex: "ECE8E3")  // Cards / surfaces
    static let stone200 = Color(hex: "DAD3CB")  // Hairlines, dividers, borders
    static let stone400 = Color(hex: "A89E92")  // Muted captions / placeholders

    // MARK: Ink (espresso near-black)
    static let ink = Color(hex: "2B2724")       // Primary text
    static let inkSoft = Color(hex: "5C554E")   // Secondary text

    // MARK: Clay (the accent — used sparingly)
    static let clay = Color(hex: "9C5B3B")      // Buttons, links, active states
    static let clayDeep = Color(hex: "7E4730")  // Pressed / active accent

    // MARK: Sage (positive signals only — kept rare)
    static let sage = Color(hex: "6E7257")      // In stock, success

    // MARK: Semantic aliases
    static let appBackground = Color.stone50
    static let cardBackground = Color.stone100
    static let primaryText = Color.ink
    static let secondaryText = Color.inkSoft
    static let appAccent = Color.clay
    static let accentPressed = Color.clayDeep
    static let divider = Color.stone200
    static let placeholder = Color.stone400
    static let positive = Color.sage
}

// MARK: - Hex Initializer

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
