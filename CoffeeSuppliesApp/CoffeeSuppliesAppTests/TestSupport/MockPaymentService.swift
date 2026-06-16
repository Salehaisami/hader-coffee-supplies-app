import Foundation
@testable import CoffeeSuppliesApp

/// Mock payment service for unit testing.
final class MockPaymentService: PaymentServiceProtocol {
    var isApplePayAvailable: Bool = true

    /// Track method calls.
    var methodCalls: [String] = []

    /// Simulated result for processApplePay.
    var simulatedResult: PaymentResult = .success

    func processApplePay(amount: Double, description: String) async -> PaymentResult {
        methodCalls.append("processApplePay(\(amount), \(description))")
        return simulatedResult
    }

    func reset() {
        isApplePayAvailable = true
        methodCalls = []
        simulatedResult = .success
    }
}
