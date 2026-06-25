import Foundation
import Observation
import CoreLocation

/// Centralized app configuration loaded from Firestore `config/` documents.
/// Provides sensible defaults so the app works even without Firestore connectivity.
@MainActor
@Observable
final class AppConfigManager {
    static let shared = AppConfigManager()

    // MARK: - Delivery Zones

    var deliveryZones: [DeliveryZone] = [
        // Default fallback (same as current hardcoded JeddahGeofence value)
        DeliveryZone(
            id: "jeddah",
            labelAr: "جدة",
            labelEn: "Jeddah",
            center: GeoPoint(lat: 21.4858, lng: 39.1925),
            radiusMeters: 55_000,
            enabled: true
        )
    ]

    // MARK: - Payment Methods

    var enabledPaymentMethods: [String] = ["apple_pay", "cash_on_delivery"]

    // MARK: - Delivery Estimates

    var defaultDeliveryMin: Int = 2
    var defaultDeliveryMax: Int = 4
    var defaultDeliveryUnit: String = "days"

    // MARK: - General

    var currency: String = "SAR"
    var currencySymbolAr: String = "ر.س"
    var currencySymbolEn: String = "SAR"
    var supportPhone: String = ""
    var supportEmail: String = ""

    // MARK: - Notifications

    var orderConfirmationEnabled: Bool = true
    var orderStatusChangeEnabled: Bool = true
    var orderCancellationEnabled: Bool = true
    var promotionsEnabled: Bool = false

    // MARK: - Order Limits

    /// Minimum order amount in SAR. 0 means no minimum.
    var minimumOrderAmount: Double = 0
    /// Maximum order amount in SAR. 0 means no maximum.
    var maximumOrderAmount: Double = 0

    // MARK: - Dependencies

    @ObservationIgnored private var firestoreService: FirestoreServiceProtocol?

    private init() {
        self.firestoreService = nil
    }

    init(firestoreService: FirestoreServiceProtocol) {
        self.firestoreService = firestoreService
    }

    // MARK: - Load Config

    /// Loads all configuration documents from Firestore.
    /// Failures are silently ignored — defaults remain in place.
    func loadConfig() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadDeliveryZones() }
            group.addTask { await self.loadPaymentMethods() }
            group.addTask { await self.loadDeliveryEstimates() }
            group.addTask { await self.loadGeneral() }
            group.addTask { await self.loadNotifications() }
            group.addTask { await self.loadOrderLimits() }
        }
    }

    // MARK: - Delivery Zone Check

    /// Whether a coordinate falls within any enabled delivery zone.
    func isInDeliveryZone(_ coordinate: CLLocationCoordinate2D) -> Bool {
        deliveryZones.filter(\.enabled).contains { zone in
            let center = CLLocation(latitude: zone.center.lat, longitude: zone.center.lng)
            let point = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
            return point.distance(from: center) <= zone.radiusMeters
        }
    }

    /// The first enabled zone's center (for default map position).
    var defaultCenter: CLLocationCoordinate2D {
        guard let zone = deliveryZones.first(where: \.enabled) else {
            return CLLocationCoordinate2D(latitude: 21.4858, longitude: 39.1925)
        }
        return CLLocationCoordinate2D(latitude: zone.center.lat, longitude: zone.center.lng)
    }

    // MARK: - Private Loaders

    private func loadDeliveryZones() async {
        guard let service = firestoreService else { return }
        do {
            let config: DeliveryZonesConfig = try await service.getDocument(
                collection: "config", documentId: "deliveryZones"
            )
            if !config.zones.isEmpty {
                deliveryZones = config.zones
            }
        } catch {
            // Keep defaults
        }
    }

    private func loadPaymentMethods() async {
        guard let service = firestoreService else { return }
        do {
            let config: PaymentMethodsConfig = try await service.getDocument(
                collection: "config", documentId: "paymentMethods"
            )
            let enabled = config.methods.filter(\.enabled).map(\.id)
            if !enabled.isEmpty {
                enabledPaymentMethods = enabled
            }
        } catch {
            // Keep defaults
        }
    }

    private func loadDeliveryEstimates() async {
        guard let service = firestoreService else { return }
        do {
            let config: DeliveryEstimatesConfig = try await service.getDocument(
                collection: "config", documentId: "deliveryEstimates"
            )
            defaultDeliveryMin = config.defaultMin
            defaultDeliveryMax = config.defaultMax
            defaultDeliveryUnit = config.defaultUnit
        } catch {
            // Keep defaults
        }
    }

    private func loadGeneral() async {
        guard let service = firestoreService else { return }
        do {
            let config: GeneralConfig = try await service.getDocument(
                collection: "config", documentId: "general"
            )
            currency = config.currency
            currencySymbolAr = config.currencySymbolAr
            currencySymbolEn = config.currencySymbolEn
            supportPhone = config.supportPhone
            supportEmail = config.supportEmail
        } catch {
            // Keep defaults
        }
    }

    private func loadNotifications() async {
        guard let service = firestoreService else { return }
        do {
            let config: NotificationsConfig = try await service.getDocument(
                collection: "config", documentId: "notifications"
            )
            orderConfirmationEnabled = config.orderConfirmation
            orderStatusChangeEnabled = config.orderStatusChange
            orderCancellationEnabled = config.orderCancellation
            promotionsEnabled = config.promotions
        } catch {
            // Keep defaults
        }
    }

    private func loadOrderLimits() async {
        guard let service = firestoreService else { return }
        do {
            let config: OrderLimitsConfig = try await service.getDocument(
                collection: "config", documentId: "orderLimits"
            )
            minimumOrderAmount = config.minimumOrderAmount
            maximumOrderAmount = config.maximumOrderAmount
        } catch {
            // Keep defaults
        }
    }
}

// MARK: - Config DTOs

struct DeliveryZone: Codable, Identifiable {
    let id: String
    let labelAr: String
    let labelEn: String
    let center: GeoPoint
    let radiusMeters: Double
    let enabled: Bool

    var localizedLabel: String {
        LanguageManager.shared.resolve(ar: labelAr, en: labelEn)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case labelAr = "label_ar"
        case labelEn = "label_en"
        case center
        case radiusMeters
        case enabled
    }
}

struct GeoPoint: Codable {
    let lat: Double
    let lng: Double
}

private struct DeliveryZonesConfig: Codable {
    let zones: [DeliveryZone]
}

private struct PaymentMethodConfig: Codable {
    let id: String
    let labelAr: String
    let labelEn: String
    let enabled: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case labelAr = "label_ar"
        case labelEn = "label_en"
        case enabled
    }
}

private struct PaymentMethodsConfig: Codable {
    let methods: [PaymentMethodConfig]
}

private struct DeliveryEstimatesConfig: Codable {
    let defaultMin: Int
    let defaultMax: Int
    let defaultUnit: String
}

private struct GeneralConfig: Codable {
    let currency: String
    let currencySymbolAr: String
    let currencySymbolEn: String
    let countryCode: String
    let appNameAr: String
    let appNameEn: String
    let supportPhone: String
    let supportEmail: String

    enum CodingKeys: String, CodingKey {
        case currency
        case currencySymbolAr = "currencySymbol_ar"
        case currencySymbolEn = "currencySymbol_en"
        case countryCode
        case appNameAr = "appName_ar"
        case appNameEn = "appName_en"
        case supportPhone
        case supportEmail
    }
}

private struct NotificationsConfig: Codable {
    let orderConfirmation: Bool
    let orderStatusChange: Bool
    let orderCancellation: Bool
    let promotions: Bool
}

private struct OrderLimitsConfig: Codable {
    let minimumOrderAmount: Double
    let maximumOrderAmount: Double
}
