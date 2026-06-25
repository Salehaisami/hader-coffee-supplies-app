import Foundation
import CoreLocation
import Observation

/// ViewModel for the checkout screen.
/// Collects delivery details, validates the Jeddah geofence, processes payment
/// (Apple Pay or Cash on Delivery), assembles the order, and writes it to Firestore.
@MainActor
@Observable
final class CheckoutViewModel {
    // MARK: - Delivery State

    /// The pinned delivery coordinate (set by the location picker).
    var deliveryCoordinate: CLLocationCoordinate2D?
    var selectedDistrict: District?
    var street: String = ""
    var notes: String = ""
    var businessName: String = ""
    var phone: String = ""

    /// Whether the user's account is suspended (blocks ordering).
    var isSuspended: Bool = false

    // MARK: - Payment State

    var selectedPaymentMethod: PaymentMethod = .cashOnDelivery
    var isPlacingOrder: Bool = false
    var errorMessage: String?
    /// After an Apple Pay failure, offer a one-tap switch to Cash on Delivery.
    var showApplePayFallback: Bool = false

    /// The successfully placed order (drives navigation to the confirmation screen).
    var placedOrder: Order?

    // MARK: - Dependencies

    @ObservationIgnored private let cart: CartStore
    @ObservationIgnored private let firestoreService: FirestoreServiceProtocol
    @ObservationIgnored private let paymentService: PaymentServiceProtocol
    @ObservationIgnored private let customerId: String
    @ObservationIgnored private let now: () -> Date

    // MARK: - Init

    init(
        cart: CartStore,
        firestoreService: FirestoreServiceProtocol,
        paymentService: PaymentServiceProtocol,
        customerId: String,
        now: @escaping () -> Date = Date.init
    ) {
        self.cart = cart
        self.firestoreService = firestoreService
        self.paymentService = paymentService
        self.customerId = customerId
        self.now = now
    }

    // MARK: - Pre-fill

    /// Pre-fill business name, phone, and saved delivery location from the user's profile.
    func loadUserProfile() async {
        do {
            let user: AppUser = try await firestoreService.getDocument(collection: "users", documentId: customerId)
            businessName = user.businessName
            phone = user.phone
            isSuspended = user.status == .suspended
            if let saved = user.deliveryAddress {
                deliveryCoordinate = CLLocationCoordinate2D(latitude: saved.lat, longitude: saved.lng)
                selectedDistrict = JeddahDistricts.all.first { $0.localizedName == saved.district }
                    ?? JeddahDistricts.all.first { $0.nameAr == saved.district || $0.nameEn == saved.district }
                street = saved.street ?? ""
                notes = saved.notes ?? ""
            }
        } catch {
            // No saved profile yet — fields stay empty for manual entry.
        }
    }

    // MARK: - Derived / Validation

    var subtotal: Double { cart.subtotal }
    var total: Double { cart.subtotal } // VAT-inclusive prices, no separate tax line.

    var isApplePayAvailable: Bool { paymentService.isApplePayAvailable }

    /// Whether the pinned location is within any configured delivery zone.
    var isInJeddah: Bool {
        guard let coordinate = deliveryCoordinate else { return false }
        return AppConfigManager.shared.isInDeliveryZone(coordinate)
    }

    /// Payment methods available based on remote config.
    var availablePaymentMethods: [PaymentMethod] {
        let enabled = AppConfigManager.shared.enabledPaymentMethods
        return PaymentMethod.allCases.filter { enabled.contains($0.rawValue) }
    }

    /// Whether the order can be placed: non-empty cart, a valid in-zone location, and not already in progress.
    var canPlaceOrder: Bool {
        !cart.isEmpty && deliveryCoordinate != nil && isInJeddah && !businessName.isEmpty && !isPlacingOrder && !isSuspended && orderLimitMessage == nil
    }

    /// Returns an error message if the cart total violates order limits, nil otherwise.
    var orderLimitMessage: String? {
        let config = AppConfigManager.shared
        let total = cart.subtotal

        if config.minimumOrderAmount > 0 && total < config.minimumOrderAmount {
            let min = NumberFormatting.priceWithCurrency(config.minimumOrderAmount)
            return LanguageManager.shared.resolve(
                ar: "الحد الأدنى للطلب \(min)",
                en: "Minimum order is \(min)"
            )
        }

        if config.maximumOrderAmount > 0 && total > config.maximumOrderAmount {
            let max = NumberFormatting.priceWithCurrency(config.maximumOrderAmount)
            return LanguageManager.shared.resolve(
                ar: "الحد الأقصى للطلب \(max)",
                en: "Maximum order is \(max)"
            )
        }

        return nil
    }

    /// Message shown when the pin is outside Jeddah.
    var outOfZoneMessage: String { L10n.outsideJeddah }

    // MARK: - Place Order

    func placeOrder() async {
        guard canPlaceOrder else { return }

        isPlacingOrder = true
        errorMessage = nil
        showApplePayFallback = false

        // Process payment first.
        let paymentStatus: PaymentStatus
        switch selectedPaymentMethod {
        case .applePay:
            let result = await paymentService.processApplePay(
                amount: total,
                description: L10n.checkoutTitle
            )
            switch result {
            case .success:
                paymentStatus = .paid
            case .cancelled:
                isPlacingOrder = false
                return // user cancelled — silent, stay on checkout
            case .failed(let message):
                errorMessage = message.isEmpty ? L10n.applePayFailed : message
                showApplePayFallback = true
                isPlacingOrder = false
                return
            }
        case .cashOnDelivery:
            paymentStatus = .codUnpaid
        }

        // Assemble and persist the order.
        let order = buildOrder(paymentStatus: paymentStatus)
        do {
            try await firestoreService.setDocument(collection: "orders", documentId: order.id, data: order)
            placedOrder = order
            cart.clear()
        } catch {
            errorMessage = error.localizedDescription
        }
        isPlacingOrder = false
    }

    /// Switch to Cash on Delivery (used from the Apple Pay failure fallback).
    func switchToCashOnDelivery() {
        selectedPaymentMethod = .cashOnDelivery
        showApplePayFallback = false
        errorMessage = nil
    }

    // MARK: - Order Assembly

    /// Build the order from the current cart and delivery details. Internal for testability.
    func buildOrder(paymentStatus: PaymentStatus, id: String = UUID().uuidString) -> Order {
        let lineItems = cart.items.map { item in
            OrderLineItem(
                productId: item.productId,
                name: item.name,
                variantLabel: item.variantLabel,
                pricingUnitLabel: item.pricingUnitLabel,
                unitPrice: item.unitPrice,
                costPrice: item.costPrice,
                quantity: item.quantity,
                lineTotal: item.lineTotal
            )
        }

        let coordinate = deliveryCoordinate!  // Safe: canPlaceOrder guarantees non-nil
        let address = DeliveryAddress(
            city: "Jeddah",
            district: selectedDistrict?.localizedName ?? "—",
            street: street.isEmpty ? nil : street,
            notes: notes.isEmpty ? nil : notes,
            lat: coordinate.latitude,
            lng: coordinate.longitude
        )

        return Order(
            id: id,
            customerId: customerId,
            businessName: businessName,
            deliveryAddress: address,
            items: lineItems,
            subtotal: subtotal,
            total: total,
            paymentMethod: selectedPaymentMethod,
            paymentStatus: paymentStatus,
            status: .pending,
            supplierId: nil,
            createdAt: now(),
            updatedAt: nil
        )
    }
}
