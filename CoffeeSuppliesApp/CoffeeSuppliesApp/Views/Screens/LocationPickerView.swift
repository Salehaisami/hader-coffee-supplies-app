import SwiftUI
import MapKit

/// Delivery location picker: a map with a fixed center pin (the map moves under it),
/// auto-locate, district suggestion, Jeddah geofence validation, and a confirm action.
struct LocationPickerView: View {
    @Bindable var viewModel: LocationPickerViewModel
    @State private var cameraPosition: MapCameraPosition

    /// Called with the confirmed coordinate + resolved district when the user confirms.
    let onConfirm: (CLLocationCoordinate2D, String?) -> Void

    init(
        viewModel: LocationPickerViewModel,
        onConfirm: @escaping (CLLocationCoordinate2D, String?) -> Void
    ) {
        self.viewModel = viewModel
        self.onConfirm = onConfirm
        _cameraPosition = State(initialValue: .region(MKCoordinateRegion(
            center: viewModel.pinnedCoordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
        )))
    }

    var body: some View {
        VStack(spacing: 0) {
            mapSection
            controls
        }
        .background(Color.appBackground)
        .navigationTitle(L10n.locationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.start() }
        .onChange(of: viewModel.pinnedCoordinate.latitude) { _, _ in
            moveCameraToPin()
        }
        .onChange(of: viewModel.pinnedCoordinate.longitude) { _, _ in
            moveCameraToPin()
        }
    }

    private func moveCameraToPin() {
        withAnimation {
            cameraPosition = .region(MKCoordinateRegion(
                center: viewModel.pinnedCoordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            ))
        }
    }
}

// MARK: - Sections

private extension LocationPickerView {

    var mapSection: some View {
        ZStack {
            Map(position: $cameraPosition)
                .onMapCameraChange(frequency: .onEnd) { context in
                    viewModel.updatePin(to: context.region.center)
                }
                .ignoresSafeArea(edges: .top)

            // Fixed center pin — the map moves underneath it.
            Image(systemName: "mappin")
                .font(.system(size: 36, weight: .bold))
                .foregroundStyle(Color.appAccent)
                .shadow(radius: 2)
                .offset(y: -18) // anchor the tip at center
                .allowsHitTesting(false)

            // Drag hint overlay
            VStack {
                Text(L10n.locationDragHint)
                    .font(.appCaption)
                    .foregroundStyle(Color.primaryText)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, Spacing.xxs)
                    .background(Color.appBackground.opacity(0.9))
                    .clipShape(Capsule())
                    .padding(.top, Spacing.sm)
                Spacer()
            }
        }
        .frame(maxHeight: .infinity)
    }

    var controls: some View {
        VStack(spacing: Spacing.xs) {
            Divider().overlay(Color.divider)

            // Permission-denied note (manual placement still works)
            if viewModel.isPermissionDenied {
                infoBanner(
                    icon: "location.slash",
                    text: L10n.locationPermissionDenied,
                    tint: Color.secondaryText
                )
            }

            // District suggestion
            if let district = viewModel.districtSuggestion {
                HStack(spacing: Spacing.xxs) {
                    Image(systemName: "mappin.and.ellipse")
                        .foregroundStyle(Color.appAccent)
                    Text("\(L10n.locationDistrict): \(district)")
                        .font(.appSubheadline)
                        .foregroundStyle(Color.secondaryText)
                        .environment(\.layoutDirection, .rightToLeft)
                    Spacer()
                }
                .padding(.horizontal, Spacing.sm)
            }

            // Out-of-zone warning
            if !viewModel.isInJeddah {
                infoBanner(
                    icon: "exclamationmark.triangle",
                    text: viewModel.outOfZoneMessage,
                    tint: Color.clay
                )
            }

            // Use my location
            Button {
                Task { await viewModel.locate() }
            } label: {
                HStack(spacing: Spacing.xxs) {
                    if viewModel.isLocating {
                        ProgressView().scaleEffect(0.8)
                    } else {
                        Image(systemName: "location.fill")
                    }
                    Text(L10n.locationUseCurrent)
                }
                .font(.appSubheadline)
                .foregroundStyle(Color.appAccent)
            }

            PrimaryButton(L10n.locationConfirm, isDisabled: !viewModel.canConfirm) {
                onConfirm(viewModel.pinnedCoordinate, viewModel.districtSuggestion)
            }
            .padding(.horizontal, Spacing.sm)
            .padding(.bottom, Spacing.sm)
        }
        .background(Color.appBackground)
    }

    func infoBanner(icon: String, text: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: Spacing.xxs) {
            Image(systemName: icon)
                .foregroundStyle(tint)
            Text(text)
                .font(.appCaption)
                .foregroundStyle(Color.secondaryText)
            Spacer()
        }
        .padding(Spacing.xs)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.stone100)
        .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))
        .padding(.horizontal, Spacing.sm)
    }
}

#Preview {
    NavigationStack {
        LocationPickerView(
            viewModel: LocationPickerViewModel(locationService: SystemLocationService()),
            onConfirm: { _, _ in }
        )
    }
    .environment(LanguageManager.shared)
}
