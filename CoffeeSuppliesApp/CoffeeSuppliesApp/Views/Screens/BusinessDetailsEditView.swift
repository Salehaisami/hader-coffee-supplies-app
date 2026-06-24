import SwiftUI
import MapKit
import CoreLocation

/// Edit screen for business profile: name, contact, email, and delivery location.
/// Location shows a static map snapshot of the saved address with an option to update.
struct BusinessDetailsEditView: View {
    @State private var businessName: String
    @State private var contactName: String
    @State private var email: String
    @State private var deliveryCoordinate: CLLocationCoordinate2D?
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showLocationPicker = false
    @Environment(\.dismiss) private var dismiss
    @Environment(LanguageManager.self) private var languageManager

    private let userId: String
    private let firestoreService: FirestoreServiceProtocol
    private let locationService: LocationServiceProtocol
    private let onSave: (() -> Void)?

    init(user: AppUser, firestoreService: FirestoreServiceProtocol, locationService: LocationServiceProtocol = SystemLocationService(), onSave: (() -> Void)? = nil) {
        self.userId = user.id
        self.firestoreService = firestoreService
        self.locationService = locationService
        self.onSave = onSave
        _businessName = State(initialValue: user.businessName)
        _contactName = State(initialValue: user.contactName)
        _email = State(initialValue: user.email ?? "")
        if let addr = user.deliveryAddress {
            _deliveryCoordinate = State(initialValue: CLLocationCoordinate2D(latitude: addr.lat, longitude: addr.lng))
        }
    }

    var body: some View {
        Form {
            // Business info section
            Section {
                VStack(alignment: .leading, spacing: Spacing.xxxs) {
                    Text(businessNameLabel)
                        .font(.appCaption)
                        .foregroundStyle(Color.secondaryText)
                    TextField(businessNameLabel, text: $businessName)
                        .textContentType(.organizationName)
                }

                VStack(alignment: .leading, spacing: Spacing.xxxs) {
                    Text(contactNameLabel)
                        .font(.appCaption)
                        .foregroundStyle(Color.secondaryText)
                    TextField(contactNameLabel, text: $contactName)
                        .textContentType(.name)
                }

                VStack(alignment: .leading, spacing: Spacing.xxxs) {
                    Text(emailLabel)
                        .font(.appCaption)
                        .foregroundStyle(Color.secondaryText)
                    TextField(emailLabel, text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
            } header: {
                Text(businessInfoHeader)
            }

            // Delivery location section
            Section {
                if let coordinate = deliveryCoordinate {
                    // Static map snapshot showing saved location
                    MiniMapSnapshotView(coordinate: coordinate)
                        .frame(height: 150)
                        .clipShape(RoundedRectangle(cornerRadius: Shape.inputRadius))

                    // Google Maps link
                    if let mapsURL = URL(string: "https://www.google.com/maps/search/?api=1&query=\(coordinate.latitude),\(coordinate.longitude)") {
                        Link(destination: mapsURL) {
                            HStack(spacing: Spacing.xxs) {
                                Image(systemName: "map")
                                    .foregroundStyle(Color.appAccent)
                                Text(viewOnMapLabel)
                                    .font(.appSubheadline)
                                    .foregroundStyle(Color.appAccent)
                                Spacer()
                                Image(systemName: "arrow.up.forward")
                                    .font(.appCaption)
                                    .foregroundStyle(Color.stone400)
                            }
                        }
                    }
                } else {
                    Text(noLocationSaved)
                        .font(.appBody)
                        .foregroundStyle(Color.secondaryText)
                }

                Button {
                    showLocationPicker = true
                } label: {
                    HStack {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundStyle(Color.appAccent)
                        Text(deliveryCoordinate == nil ? setLocationLabel : updateLocationLabel)
                            .foregroundStyle(Color.appAccent)
                    }
                }
            } header: {
                Text(deliveryLocationHeader)
            }

            // Error
            if let error = errorMessage {
                Section {
                    Text(error)
                        .font(.appCaption)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(L10n.businessDetails)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                if isSaving {
                    ProgressView()
                } else {
                    Button(L10n.save) {
                        Task { await save() }
                    }
                    .disabled(!canSave)
                }
            }
        }
        .fullScreenCover(isPresented: $showLocationPicker) {
            LocationPickerCoverView(
                locationService: locationService,
                initialCoordinate: deliveryCoordinate ?? JeddahGeofence.center,
                onConfirm: { coordinate in
                    self.deliveryCoordinate = coordinate
                    showLocationPicker = false
                },
                onCancel: {
                    showLocationPicker = false
                }
            )
        }
    }

    // MARK: - Logic

    private var canSave: Bool {
        !businessName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !contactName.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        do {
            var fields: [String: Any] = [
                "businessName": businessName.trimmingCharacters(in: .whitespaces),
                "contactName": contactName.trimmingCharacters(in: .whitespaces),
            ]
            let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
            if trimmedEmail.isEmpty {
                fields["email"] = NSNull()
            } else {
                fields["email"] = trimmedEmail
            }
            if let coord = deliveryCoordinate {
                fields["deliveryAddress"] = [
                    "city": "Jeddah",
                    "district": "—",
                    "lat": coord.latitude,
                    "lng": coord.longitude,
                ] as [String: Any]
            }
            try await firestoreService.updateDocument(
                collection: "users",
                documentId: userId,
                fields: fields
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    // MARK: - Localized Strings

    private var businessInfoHeader: String {
        languageManager.resolve(ar: "معلومات النشاط", en: "Business Info")
    }
    private var businessNameLabel: String {
        languageManager.resolve(ar: "اسم النشاط التجاري", en: "Business Name")
    }
    private var contactNameLabel: String {
        languageManager.resolve(ar: "اسم جهة الاتصال", en: "Contact Name")
    }
    private var emailLabel: String {
        languageManager.resolve(ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)")
    }
    private var deliveryLocationHeader: String {
        languageManager.resolve(ar: "موقع التوصيل", en: "Delivery Location")
    }
    private var noLocationSaved: String {
        languageManager.resolve(ar: "لم يتم تحديد موقع بعد", en: "No location saved yet")
    }
    private var setLocationLabel: String {
        languageManager.resolve(ar: "تحديد الموقع", en: "Set Location")
    }
    private var updateLocationLabel: String {
        languageManager.resolve(ar: "تحديث الموقع", en: "Update Location")
    }
    private var viewOnMapLabel: String {
        languageManager.resolve(ar: "عرض على الخريطة", en: "View on Map")
    }
}
