import XCTest
import CoreLocation
@testable import CoffeeSuppliesApp

/// Tests for LocationPickerViewModel: permission flows, auto-locate, pin movement,
/// district reverse-geocode, and geofence-driven confirm gating.
@MainActor
final class LocationPickerViewModelTests: XCTestCase {
    private var mockLocation: MockLocationService!

    override func setUp() {
        super.setUp()
        mockLocation = MockLocationService()
    }

    override func tearDown() {
        mockLocation = nil
        super.tearDown()
    }

    private func makeSUT(initial: CLLocationCoordinate2D = JeddahGeofence.center) -> LocationPickerViewModel {
        LocationPickerViewModel(locationService: mockLocation, initialCoordinate: initial, geocodeDebounce: .zero)
    }

    // MARK: - Permission Flows

    func testStart_NotDetermined_RequestsAuthorizationAndLocates() async {
        mockLocation.authorizationStatus = .notDetermined
        mockLocation.simulatedCoordinate = CLLocationCoordinate2D(latitude: 21.55, longitude: 39.17)
        let sut = makeSUT()

        await sut.start()

        XCTAssertTrue(mockLocation.methodCalls.contains("requestWhenInUseAuthorization"))
        XCTAssertTrue(mockLocation.methodCalls.contains("getCurrentLocation"))
        XCTAssertEqual(sut.pinnedCoordinate.latitude, 21.55, accuracy: 0.0001)
    }

    func testStart_Authorized_Locates() async {
        mockLocation.authorizationStatus = .authorizedWhenInUse
        let sut = makeSUT()

        await sut.start()

        XCTAssertTrue(mockLocation.methodCalls.contains("getCurrentLocation"))
    }

    func testStart_Denied_DoesNotLocate_ButAllowsManual() async {
        mockLocation.authorizationStatus = .denied
        let sut = makeSUT()

        await sut.start()

        XCTAssertFalse(mockLocation.methodCalls.contains("getCurrentLocation"))
        XCTAssertTrue(sut.isPermissionDenied)
        // Manual placement still works:
        sut.updatePin(to: CLLocationCoordinate2D(latitude: 21.50, longitude: 39.18))
        XCTAssertTrue(sut.isInJeddah)
    }

    // MARK: - Locate

    func testLocate_Success_MovesPin() async {
        mockLocation.simulatedCoordinate = CLLocationCoordinate2D(latitude: 21.60, longitude: 39.15)
        let sut = makeSUT()

        await sut.locate()

        XCTAssertEqual(sut.pinnedCoordinate.latitude, 21.60, accuracy: 0.0001)
        XCTAssertFalse(sut.isLocating)
        XCTAssertNil(sut.errorMessage)
    }

    func testLocate_Error_SetsErrorMessage() async {
        mockLocation.errorToThrow = NSError(domain: "loc", code: 1, userInfo: [NSLocalizedDescriptionKey: "GPS unavailable"])
        let sut = makeSUT()

        await sut.locate()

        XCTAssertEqual(sut.errorMessage, "GPS unavailable")
        XCTAssertFalse(sut.isLocating)
    }

    // MARK: - Geofence Gating

    func testCanConfirm_InsideJeddah_True() {
        let sut = makeSUT(initial: JeddahGeofence.center)
        XCTAssertTrue(sut.isInJeddah)
        XCTAssertTrue(sut.canConfirm)
    }

    func testCanConfirm_OutsideJeddah_False() {
        // Riyadh
        let sut = makeSUT(initial: CLLocationCoordinate2D(latitude: 24.7136, longitude: 46.6753))
        XCTAssertFalse(sut.isInJeddah)
        XCTAssertFalse(sut.canConfirm)
    }

    func testUpdatePin_OutsideThenInside_UpdatesGeofence() {
        let sut = makeSUT()

        sut.updatePin(to: CLLocationCoordinate2D(latitude: 24.7136, longitude: 46.6753)) // Riyadh
        XCTAssertFalse(sut.canConfirm)

        sut.updatePin(to: JeddahGeofence.center)
        XCTAssertTrue(sut.canConfirm)
    }

    // MARK: - District Reverse-Geocode

    func testUpdatePin_ReverseGeocodesDistrict() async {
        mockLocation.simulatedDistrict = "Al Rawdah"
        let sut = makeSUT()

        sut.updatePin(to: JeddahGeofence.center)
        await sut.pendingGeocode?.value

        XCTAssertEqual(sut.districtSuggestion, "Al Rawdah")
    }

    func testUpdatePin_GeocodeFailure_ClearsDistrict() async {
        mockLocation.errorToThrow = NSError(domain: "geo", code: 1)
        let sut = makeSUT()

        sut.updatePin(to: JeddahGeofence.center)
        await sut.pendingGeocode?.value

        XCTAssertNil(sut.districtSuggestion)
    }

    // MARK: - Initial Coordinate

    func testInit_DefaultsToJeddahCenter() {
        let sut = LocationPickerViewModel(locationService: mockLocation)
        XCTAssertEqual(sut.pinnedCoordinate.latitude, JeddahGeofence.center.latitude, accuracy: 0.0001)
        XCTAssertEqual(sut.pinnedCoordinate.longitude, JeddahGeofence.center.longitude, accuracy: 0.0001)
    }
}
