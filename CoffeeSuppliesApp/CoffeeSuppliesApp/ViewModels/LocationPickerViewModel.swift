import Foundation
import CoreLocation
import Observation

/// ViewModel for the delivery location picker.
/// Handles permission, auto-locating, the draggable pin coordinate, geofence validation,
/// and a reverse-geocoded district suggestion. Stores raw lat/lng as the delivery target.
@MainActor
@Observable
final class LocationPickerViewModel {
    // MARK: - State

    /// The currently pinned coordinate (the delivery target).
    var pinnedCoordinate: CLLocationCoordinate2D

    var authStatus: LocationAuthStatus = .notDetermined
    var districtSuggestion: String?
    var isLocating: Bool = false
    var errorMessage: String?

    // MARK: - Dependencies

    @ObservationIgnored private let locationService: LocationServiceProtocol
    @ObservationIgnored private var geocodeTask: Task<Void, Never>?
    @ObservationIgnored private let geocodeDebounce: Duration
    @ObservationIgnored private let hasSavedLocation: Bool

    // MARK: - Init

    init(
        locationService: LocationServiceProtocol,
        initialCoordinate: CLLocationCoordinate2D = JeddahGeofence.center,
        geocodeDebounce: Duration = .milliseconds(400)
    ) {
        self.locationService = locationService
        self.pinnedCoordinate = initialCoordinate
        self.geocodeDebounce = geocodeDebounce
        self.authStatus = locationService.authorizationStatus
        // If a non-default coordinate was provided, we have a saved location
        self.hasSavedLocation = (initialCoordinate.latitude != JeddahGeofence.center.latitude
            || initialCoordinate.longitude != JeddahGeofence.center.longitude)
    }

    // MARK: - Lifecycle

    /// Called when the picker appears. Requests permission if needed and auto-locates.
    /// Skips auto-locate if a saved location was provided (user can still tap "use my location").
    func start() async {
        authStatus = locationService.authorizationStatus

        // If we already have a saved location, just geocode it and skip auto-locate
        if hasSavedLocation {
            scheduleGeocode()
            return
        }

        switch authStatus {
        case .notDetermined:
            locationService.requestWhenInUseAuthorization()
            // Wait for the user to respond to the permission dialog
            for _ in 0..<20 {
                try? await Task.sleep(for: .milliseconds(500))
                authStatus = locationService.authorizationStatus
                if authStatus != .notDetermined { break }
            }
            if authStatus == .authorizedWhenInUse || authStatus == .authorizedAlways {
                await locate()
            }
        case .authorizedWhenInUse, .authorizedAlways:
            await locate()
        case .denied, .restricted:
            // Permission denied — the user can still place the pin manually.
            break
        }
    }

    /// Auto-locate the user and move the pin there.
    func locate() async {
        isLocating = true
        errorMessage = nil
        do {
            let coordinate = try await locationService.getCurrentLocation()
            updatePin(to: coordinate)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLocating = false
    }

    // MARK: - Pin Movement

    /// Update the pinned coordinate (e.g. when the user drags the map). Re-geocodes the district.
    func updatePin(to coordinate: CLLocationCoordinate2D) {
        pinnedCoordinate = coordinate
        scheduleGeocode()
    }

    private func scheduleGeocode() {
        geocodeTask?.cancel()
        let coordinate = pinnedCoordinate
        geocodeTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(for: self.geocodeDebounce)
            guard !Task.isCancelled else { return }
            await self.geocode(coordinate)
        }
    }

    private func geocode(_ coordinate: CLLocationCoordinate2D) async {
        do {
            districtSuggestion = try await locationService.reverseGeocode(coordinate: coordinate)
        } catch {
            districtSuggestion = nil
        }
    }

    // MARK: - Derived

    /// Whether the pin is inside any configured delivery zone.
    var isInJeddah: Bool {
        AppConfigManager.shared.isInDeliveryZone(pinnedCoordinate)
    }

    /// Whether the user can confirm this location (must be within Jeddah).
    var canConfirm: Bool {
        isInJeddah
    }

    /// Whether location permission was denied (drives the manual-pin fallback messaging).
    var isPermissionDenied: Bool {
        authStatus == .denied || authStatus == .restricted
    }

    /// The message shown when the pin is outside Jeddah.
    var outOfZoneMessage: String {
        L10n.outsideJeddah
    }

    /// For test inspection / expose the geocode task to await deterministically.
    @ObservationIgnored var pendingGeocode: Task<Void, Never>? { geocodeTask }
}
