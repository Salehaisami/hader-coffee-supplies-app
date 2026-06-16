import Foundation
import CoreLocation
@testable import CoffeeSuppliesApp

/// Mock location service for unit testing.
final class MockLocationService: LocationServiceProtocol {
    var authorizationStatus: LocationAuthStatus = .notDetermined

    /// Track method calls.
    var methodCalls: [String] = []

    /// Error to throw on next call.
    var errorToThrow: Error?

    /// Simulated coordinate returned by getCurrentLocation.
    var simulatedCoordinate = CLLocationCoordinate2D(latitude: 21.4858, longitude: 39.1925)

    /// Simulated district returned by reverseGeocode.
    var simulatedDistrict = "Al Rawdah"

    func requestWhenInUseAuthorization() {
        methodCalls.append("requestWhenInUseAuthorization")
        authorizationStatus = .authorizedWhenInUse
    }

    func getCurrentLocation() async throws -> CLLocationCoordinate2D {
        methodCalls.append("getCurrentLocation")
        if let error = errorToThrow { throw error }
        return simulatedCoordinate
    }

    func reverseGeocode(coordinate: CLLocationCoordinate2D) async throws -> String {
        methodCalls.append("reverseGeocode(\(coordinate.latitude), \(coordinate.longitude))")
        if let error = errorToThrow { throw error }
        return simulatedDistrict
    }

    func reset() {
        authorizationStatus = .notDetermined
        methodCalls = []
        errorToThrow = nil
    }
}
