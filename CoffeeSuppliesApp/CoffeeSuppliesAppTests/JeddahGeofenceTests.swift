import XCTest
import CoreLocation
@testable import CoffeeSuppliesApp

/// Tests for the Jeddah geofence: points inside, outside, and near the boundary.
final class JeddahGeofenceTests: XCTestCase {

    func testCenter_IsInside() {
        XCTAssertTrue(JeddahGeofence.contains(JeddahGeofence.center))
    }

    func testAlRawdah_IsInside() {
        // A real Jeddah district near the center.
        let alRawdah = CLLocationCoordinate2D(latitude: 21.5433, longitude: 39.1728)
        XCTAssertTrue(JeddahGeofence.contains(alRawdah))
    }

    func testObhurNorth_IsInside() {
        // Northern suburb, ~30 km from center — should be inside the 55 km radius.
        let obhur = CLLocationCoordinate2D(latitude: 21.7500, longitude: 39.0900)
        XCTAssertTrue(JeddahGeofence.contains(obhur))
    }

    func testMecca_IsOutside() {
        // Mecca is ~65 km east — must be rejected.
        let mecca = CLLocationCoordinate2D(latitude: 21.4225, longitude: 39.8262)
        XCTAssertFalse(JeddahGeofence.contains(mecca))
    }

    func testRiyadh_IsOutside() {
        let riyadh = CLLocationCoordinate2D(latitude: 24.7136, longitude: 46.6753)
        XCTAssertFalse(JeddahGeofence.contains(riyadh))
    }

    func testJustInsideBoundary_IsInside() {
        // Construct a point ~54 km due north of center (just inside 55 km).
        // ~0.00900 degrees latitude per km → 54 km ≈ 0.486 degrees.
        let justInside = CLLocationCoordinate2D(
            latitude: JeddahGeofence.center.latitude + 0.486,
            longitude: JeddahGeofence.center.longitude
        )
        XCTAssertLessThanOrEqual(JeddahGeofence.distanceFromCenter(justInside), JeddahGeofence.radiusMeters)
        XCTAssertTrue(JeddahGeofence.contains(justInside))
    }

    func testJustOutsideBoundary_IsOutside() {
        // ~60 km due north of center (outside 55 km). 60 km ≈ 0.540 degrees latitude.
        let justOutside = CLLocationCoordinate2D(
            latitude: JeddahGeofence.center.latitude + 0.540,
            longitude: JeddahGeofence.center.longitude
        )
        XCTAssertGreaterThan(JeddahGeofence.distanceFromCenter(justOutside), JeddahGeofence.radiusMeters)
        XCTAssertFalse(JeddahGeofence.contains(justOutside))
    }

    func testDistanceFromCenter_AtCenterIsZero() {
        XCTAssertEqual(JeddahGeofence.distanceFromCenter(JeddahGeofence.center), 0, accuracy: 1.0)
    }
}

/// Tests for the Jeddah district list.
final class JeddahDistrictsTests: XCTestCase {

    func testListHasAllDistricts() {
        // 33 named districts + "Other" = 34.
        XCTAssertEqual(JeddahDistricts.all.count, 34)
    }

    func testOtherIsLast() {
        XCTAssertEqual(JeddahDistricts.all.last?.id, "other")
        XCTAssertEqual(JeddahDistricts.other.id, "other")
    }

    func testDistrictsHaveUniqueIds() {
        let ids = JeddahDistricts.all.map(\.id)
        XCTAssertEqual(Set(ids).count, ids.count)
    }

    func testDistrictsAreBilingual() {
        for district in JeddahDistricts.all {
            XCTAssertFalse(district.nameAr.isEmpty, "\(district.id) missing Arabic name")
            XCTAssertFalse(district.nameEn.isEmpty, "\(district.id) missing English name")
        }
    }
}
