import Foundation
import CoreLocation

/// Jeddah delivery-zone geofence.
///
/// Phase One uses a generous center-point + radius check (see Phase1-Resolved-Decisions §1).
/// The radius is deliberately wide so GPS drift and edge neighborhoods aren't rejected;
/// false negatives (rejecting a real Jeddah cafe) are worse than false positives.
enum JeddahGeofence {
    /// Approximate city centroid, near Al Balad.
    static let center = CLLocationCoordinate2D(latitude: 21.4858, longitude: 39.1925)

    /// 55 km — covers the ~70 km north-south span plus buffer, without reaching Mecca (~65 km east).
    static let radiusMeters: CLLocationDistance = 55_000

    /// Whether a coordinate falls within the Jeddah delivery zone.
    static func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        distanceFromCenter(coordinate) <= radiusMeters
    }

    /// Distance in meters from the Jeddah center to the given coordinate.
    static func distanceFromCenter(_ coordinate: CLLocationCoordinate2D) -> CLLocationDistance {
        let centerLocation = CLLocation(latitude: center.latitude, longitude: center.longitude)
        let pinLocation = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        return pinLocation.distance(from: centerLocation)
    }
}
