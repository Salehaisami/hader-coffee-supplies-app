import SwiftUI

@main
struct CoffeeSuppliesApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @State private var languageManager = LanguageManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.layoutDirection, languageManager.layoutDirection)
                .environment(\.locale, languageManager.locale)
                .environment(languageManager)
                .preferredColorScheme(.light)
                .task {
                    // Load remote config at app launch
                    let configManager = AppConfigManager(firestoreService: FirebaseFirestoreService())
                    await configManager.loadConfig()
                    // Copy loaded values to the shared singleton
                    AppConfigManager.shared.deliveryZones = configManager.deliveryZones
                    AppConfigManager.shared.enabledPaymentMethods = configManager.enabledPaymentMethods
                    AppConfigManager.shared.defaultDeliveryMin = configManager.defaultDeliveryMin
                    AppConfigManager.shared.defaultDeliveryMax = configManager.defaultDeliveryMax
                    AppConfigManager.shared.defaultDeliveryUnit = configManager.defaultDeliveryUnit
                    AppConfigManager.shared.currency = configManager.currency
                    AppConfigManager.shared.currencySymbolAr = configManager.currencySymbolAr
                    AppConfigManager.shared.currencySymbolEn = configManager.currencySymbolEn
                    AppConfigManager.shared.supportPhone = configManager.supportPhone
                    AppConfigManager.shared.supportEmail = configManager.supportEmail
                    AppConfigManager.shared.orderConfirmationEnabled = configManager.orderConfirmationEnabled
                    AppConfigManager.shared.orderStatusChangeEnabled = configManager.orderStatusChangeEnabled
                    AppConfigManager.shared.orderCancellationEnabled = configManager.orderCancellationEnabled
                    AppConfigManager.shared.promotionsEnabled = configManager.promotionsEnabled
                    AppConfigManager.shared.minimumOrderAmount = configManager.minimumOrderAmount
                    AppConfigManager.shared.maximumOrderAmount = configManager.maximumOrderAmount
                }
        }
    }
}
