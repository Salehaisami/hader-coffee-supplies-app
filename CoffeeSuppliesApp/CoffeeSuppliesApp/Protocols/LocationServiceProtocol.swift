import Foundation
import CoreLocation

/// Location authorization status.
enum LocationAuthStatus: Equatable {
    case notDetermined
    case restricted
    case denied
    case authorizedWhenInUse
    case authorizedAlways
}

/// Protocol wrapping location services for testability.
protocol LocationServiceProtocol {
    /// Current authorization status.
    var authorizationStatus: LocationAuthStatus { get }

    /// Request when-in-use authorization.
    func requestWhenInUseAuthorization()

    /// Get the user's current location.
    func getCurrentLocation() async throws -> CLLocationCoordinate2D

    /// Reverse geocode coordinates to an address/district.
    func reverseGeocode(coordinate: CLLocationCoordinate2D) async throws -> String
}
