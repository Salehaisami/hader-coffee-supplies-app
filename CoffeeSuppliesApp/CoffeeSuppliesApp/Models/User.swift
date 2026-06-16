import Foundation

/// User roles in the system.
enum UserRole: String, Codable {
    case customer
    case admin
}

/// User account status (does not block ordering).
enum UserStatus: String, Codable {
    case pending
    case approved
    case suspended
}

/// Delivery address with coordinates.
struct DeliveryAddress: Codable, Equatable {
    let city: String
    let district: String
    let street: String?
    let notes: String?
    let lat: Double
    let lng: Double

    init(city: String = "Jeddah", district: String, street: String? = nil, notes: String? = nil, lat: Double, lng: Double) {
        self.city = city
        self.district = district
        self.street = street
        self.notes = notes
        self.lat = lat
        self.lng = lng
    }
}

/// User document model matching Firestore schema.
struct AppUser: Codable, Identifiable, Equatable {
    let id: String
    let businessName: String
    let contactName: String
    let phone: String
    let email: String?
    let deliveryAddress: DeliveryAddress?
    let role: UserRole
    let status: UserStatus
    let createdAt: Date

    init(
        id: String,
        businessName: String,
        contactName: String,
        phone: String,
        email: String? = nil,
        deliveryAddress: DeliveryAddress? = nil,
        role: UserRole = .customer,
        status: UserStatus = .pending,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.businessName = businessName
        self.contactName = contactName
        self.phone = phone
        self.email = email
        self.deliveryAddress = deliveryAddress
        self.role = role
        self.status = status
        self.createdAt = createdAt
    }
}
