import Foundation
import CoreLocation

/// Production location service backed by CoreLocation.
/// Bridges the CLLocationManager delegate callbacks to the async protocol.
final class SystemLocationService: NSObject, LocationServiceProtocol, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private let geocoder = CLGeocoder()

    private var locationContinuation: CheckedContinuation<CLLocationCoordinate2D, Error>?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
    }

    var authorizationStatus: LocationAuthStatus {
        Self.map(manager.authorizationStatus)
    }

    func requestWhenInUseAuthorization() {
        manager.requestWhenInUseAuthorization()
    }

    func getCurrentLocation() async throws -> CLLocationCoordinate2D {
        try await withThrowingTaskGroup(of: CLLocationCoordinate2D.self) { group in
            group.addTask {
                try await withCheckedThrowingContinuation { continuation in
                    if self.locationContinuation != nil {
                        continuation.resume(throwing: LocationError.requestInProgress)
                        return
                    }
                    self.locationContinuation = continuation
                    self.manager.requestLocation()
                }
            }
            group.addTask {
                try await Task.sleep(for: .seconds(10))
                throw LocationError.timeout
            }
            let result = try await group.next()!
            group.cancelAll()
            return result
        }
    }

    func reverseGeocode(coordinate: CLLocationCoordinate2D) async throws -> String {
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        let placemarks = try await geocoder.reverseGeocodeLocation(location)
        // Prefer sub-locality (district), then locality (city).
        if let district = placemarks.first?.subLocality ?? placemarks.first?.locality {
            return district
        }
        throw LocationError.geocodingFailed
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let coordinate = locations.last?.coordinate else { return }
        locationContinuation?.resume(returning: coordinate)
        locationContinuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationContinuation?.resume(throwing: error)
        locationContinuation = nil
    }

    // MARK: - Mapping

    private static func map(_ status: CLAuthorizationStatus) -> LocationAuthStatus {
        switch status {
        case .notDetermined: return .notDetermined
        case .restricted: return .restricted
        case .denied: return .denied
        case .authorizedWhenInUse: return .authorizedWhenInUse
        case .authorizedAlways: return .authorizedAlways
        @unknown default: return .denied
        }
    }
}

enum LocationError: Error, LocalizedError {
    case requestInProgress
    case geocodingFailed
    case timeout

    var errorDescription: String? {
        switch self {
        case .requestInProgress: return "A location request is already in progress."
        case .geocodingFailed: return "Could not determine the address for this location."
        case .timeout: return "Location request timed out. Please try again or place the pin manually."
        }
    }
}
