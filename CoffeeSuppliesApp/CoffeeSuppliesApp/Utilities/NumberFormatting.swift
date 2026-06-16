import Foundation

/// Number formatting utilities that enforce Western digits (0–9) in both locales.
enum NumberFormatting {
    /// Formats a price value with Western digits. Always uses "SAR" currency.
    /// Example: 48.00
    static func price(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    /// Formats a price with SAR label.
    /// Example: "SAR 48" or "48 ر.س"
    static func priceWithCurrency(_ value: Double) -> String {
        "\(price(value)) SAR"
    }

    /// Formats an integer quantity with Western digits.
    static func quantity(_ value: Int) -> String {
        "\(value)"
    }

    /// Formats a decimal number with Western digits pinned to en locale.
    static func decimal(_ value: Double, fractionDigits: Int = 2) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = fractionDigits
        formatter.locale = Locale(identifier: "en_US")
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
