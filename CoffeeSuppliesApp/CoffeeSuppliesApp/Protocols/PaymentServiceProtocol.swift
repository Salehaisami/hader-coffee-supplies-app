import Foundation

/// Payment method options.
enum PaymentMethod: String, Codable, CaseIterable {
    case applePay = "apple_pay"
    case cashOnDelivery = "cash_on_delivery"
}

/// Payment processing result.
enum PaymentResult: Equatable {
    case success
    case cancelled
    case failed(String)
}

/// Protocol wrapping payment operations for testability.
protocol PaymentServiceProtocol {
    /// Check if Apple Pay is available on this device.
    var isApplePayAvailable: Bool { get }

    /// Process a payment with Apple Pay.
    /// - Parameters:
    ///   - amount: Total amount in SAR.
    ///   - description: Description shown on the payment sheet.
    func processApplePay(amount: Double, description: String) async -> PaymentResult
}
