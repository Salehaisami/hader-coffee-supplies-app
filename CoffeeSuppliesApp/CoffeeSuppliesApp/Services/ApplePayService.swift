import Foundation
import PassKit

/// Production payment service backed by Apple Pay (PassKit).
///
/// Note: a configured Apple Pay merchant ID + the Apple Pay capability/entitlement are required
/// for live transactions (see Phase1-Resolved-Decisions — Apple Developer setup). The merchant ID
/// is read from the build configuration so it isn't hard-coded here.
final class ApplePayService: NSObject, PaymentServiceProtocol {
    private let merchantId: String
    private let countryCode = "SA"
    private let currencyCode = "SAR"

    private var continuation: CheckedContinuation<PaymentResult, Never>?
    private var didAuthorize = false

    init(merchantId: String = Bundle.main.object(forInfoDictionaryKey: "ApplePayMerchantId") as? String ?? "") {
        self.merchantId = merchantId
    }

    var isApplePayAvailable: Bool {
        !merchantId.isEmpty && PKPaymentAuthorizationController.canMakePayments()
    }

    func processApplePay(amount: Double, description: String) async -> PaymentResult {
        guard isApplePayAvailable else {
            return .failed(L10n.applePayFailed)
        }

        let request = PKPaymentRequest()
        request.merchantIdentifier = merchantId
        request.merchantCapabilities = .threeDSecure
        request.countryCode = countryCode
        request.currencyCode = currencyCode
        request.supportedNetworks = [.visa, .masterCard, .mada]
        request.paymentSummaryItems = [
            PKPaymentSummaryItem(label: description, amount: NSDecimalNumber(value: amount))
        ]

        return await withCheckedContinuation { continuation in
            self.continuation = continuation
            self.didAuthorize = false
            let controller = PKPaymentAuthorizationController(paymentRequest: request)
            controller.delegate = self
            controller.present { presented in
                if !presented {
                    self.finish(.failed(L10n.applePayFailed))
                }
            }
        }
    }

    private func finish(_ result: PaymentResult) {
        continuation?.resume(returning: result)
        continuation = nil
    }
}

extension ApplePayService: PKPaymentAuthorizationControllerDelegate {
    func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        // In Phase One there's no payment processor wired up server-side yet;
        // a real integration would submit payment.token to the processor here.
        didAuthorize = true
        completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
    }

    func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
        controller.dismiss {
            // If the sheet finished without an authorization, the user cancelled.
            self.finish(self.didAuthorize ? .success : .cancelled)
        }
    }
}
