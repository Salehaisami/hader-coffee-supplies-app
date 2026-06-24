import SwiftUI
import CoreLocation

/// A wrapper that owns the LocationPickerViewModel as @State,
/// preventing SwiftUI parent body re-evaluations from recreating it.
struct LocationPickerCoverView: View {
    @State private var viewModel: LocationPickerViewModel
    let onConfirm: (CLLocationCoordinate2D) -> Void
    let onCancel: () -> Void

    init(
        locationService: LocationServiceProtocol,
        initialCoordinate: CLLocationCoordinate2D,
        onConfirm: @escaping (CLLocationCoordinate2D) -> Void,
        onCancel: @escaping () -> Void
    ) {
        _viewModel = State(initialValue: LocationPickerViewModel(
            locationService: locationService,
            initialCoordinate: initialCoordinate
        ))
        self.onConfirm = onConfirm
        self.onCancel = onCancel
    }

    var body: some View {
        NavigationStack {
            LocationPickerView(
                viewModel: viewModel,
                onConfirm: { coordinate, _ in
                    onConfirm(coordinate)
                }
            )
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.cancel) {
                        onCancel()
                    }
                }
            }
        }
    }
}
