import SwiftUI
import CoreLocation

/// Standalone delivery location editor accessible from the Account menu.
/// Reuses the LocationPickerView and saves the result to the user's profile.
struct DeliveryLocationEditView: View {
    @State private var isSaving = false
    @Environment(\.dismiss) private var dismiss

    private let userId: String
    private let currentAddress: DeliveryAddress?
    private let firestoreService: FirestoreServiceProtocol
    private let locationService: LocationServiceProtocol

    init(
        userId: String,
        currentAddress: DeliveryAddress?,
        firestoreService: FirestoreServiceProtocol,
        locationService: LocationServiceProtocol = SystemLocationService()
    ) {
        self.userId = userId
        self.currentAddress = currentAddress
        self.firestoreService = firestoreService
        self.locationService = locationService
    }

    var body: some View {
        LocationPickerView(
            viewModel: LocationPickerViewModel(
                locationService: locationService,
                initialCoordinate: initialCoordinate
            ),
            onConfirm: { coordinate, district in
                Task { await saveLocation(coordinate: coordinate, district: district) }
            }
        )
    }

    private var initialCoordinate: CLLocationCoordinate2D {
        if let addr = currentAddress {
            return CLLocationCoordinate2D(latitude: addr.lat, longitude: addr.lng)
        }
        return JeddahGeofence.center
    }

    private func saveLocation(coordinate: CLLocationCoordinate2D, district: String?) async {
        isSaving = true
        let address: [String: Any] = [
            "city": "Jeddah",
            "district": district ?? "Other",
            "lat": coordinate.latitude,
            "lng": coordinate.longitude,
        ]
        do {
            try await firestoreService.updateDocument(
                collection: "users",
                documentId: userId,
                fields: ["deliveryAddress": address]
            )
            dismiss()
        } catch {
            // Silently fail — user can retry
        }
        isSaving = false
    }
}
