import XCTest
import CoreLocation
@testable import CoffeeSuppliesApp

/// Tests for LocationPickerViewModel's saved-location behavior.
@MainActor
final class LocationPickerSavedLocationTests: XCTestCase {
    private var mockLocation: MockLocationService!

    override func setUp() {
        super.setUp()
        mockLocation = MockLocationService()
        mockLocation.authorizationStatus = .authorizedWhenInUse
    }

    func testStart_WithSavedLocation_SkipsAutoLocate() async {
        let savedCoord = CLLocationCoordinate2D(latitude: 21.55, longitude: 39.20)
        let sut = LocationPickerViewModel(
            locationService: mockLocation,
            initialCoordinate: savedCoord
        )

        await sut.start()

        // Should NOT have called getCurrentLocation
        XCTAssertFalse(mockLocation.methodCalls.contains("getCurrentLocation"))
        // Pin should remain at saved location
        XCTAssertEqual(sut.pinnedCoordinate.latitude, 21.55, accuracy: 0.001)
        XCTAssertEqual(sut.pinnedCoordinate.longitude, 39.20, accuracy: 0.001)
    }

    func testStart_WithDefaultLocation_DoesAutoLocate() async {
        // Use default (JeddahGeofence.center) — should auto-locate
        let sut = LocationPickerViewModel(
            locationService: mockLocation,
            initialCoordinate: JeddahGeofence.center
        )

        await sut.start()

        // Should have called getCurrentLocation
        XCTAssertTrue(mockLocation.methodCalls.contains("getCurrentLocation"))
    }

    func testStart_WithSavedLocation_StillAllowsManualLocate() async {
        let savedCoord = CLLocationCoordinate2D(latitude: 21.55, longitude: 39.20)
        let sut = LocationPickerViewModel(
            locationService: mockLocation,
            initialCoordinate: savedCoord
        )

        await sut.start()

        // Verify no auto-locate happened
        XCTAssertFalse(mockLocation.methodCalls.contains("getCurrentLocation"))

        // But manual locate() should still work
        await sut.locate()
        XCTAssertTrue(mockLocation.methodCalls.contains("getCurrentLocation"))
    }

    func testLocate_Button_UpdatesPin() async {
        let savedCoord = CLLocationCoordinate2D(latitude: 21.55, longitude: 39.20)
        let sut = LocationPickerViewModel(
            locationService: mockLocation,
            initialCoordinate: savedCoord
        )

        // Simulate user tapping "Use my location"
        mockLocation.simulatedCoordinate = CLLocationCoordinate2D(latitude: 21.60, longitude: 39.25)
        await sut.locate()

        XCTAssertEqual(sut.pinnedCoordinate.latitude, 21.60, accuracy: 0.001)
        XCTAssertEqual(sut.pinnedCoordinate.longitude, 39.25, accuracy: 0.001)
    }
}
