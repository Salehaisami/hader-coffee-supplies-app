import UIKit
import FirebaseCore
import FirebaseAuth
import FirebaseMessaging
import FirebaseFirestore

/// AppDelegate to handle APNs token forwarding for Firebase Phone Auth.
/// Required because FirebaseAppDelegateProxyEnabled is set to false.
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Configure Firebase before anything else
        #if DEBUG
        if let path = Bundle.main.path(forResource: "GoogleService-Info-Dev", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
        } else {
            FirebaseApp.configure()
        }
        #else
        if let path = Bundle.main.path(forResource: "GoogleService-Info-Prod", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
        } else {
            FirebaseApp.configure()
        }
        #endif

        // Register for remote notifications so Firebase can receive APNs token for phone auth
        application.registerForRemoteNotifications()

        // Save FCM token to user document when auth state changes
        Auth.auth().addStateDidChangeListener { _, user in
            guard let user = user else { return }
            self.saveFCMToken(for: user.uid)
        }

        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Auth.auth().setAPNSToken(deviceToken, type: .unknown)
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // Push registration failed (expected on simulator).
        // Firebase will fall back to reCAPTCHA verification.
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any]
    ) async -> UIBackgroundFetchResult {
        if Auth.auth().canHandleNotification(userInfo) {
            return .noData
        }
        return .newData
    }

    func application(
        _ application: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        if Auth.auth().canHandle(url) {
            return true
        }
        return false
    }

    // MARK: - FCM Token Persistence

    /// Save the current FCM token to the user's Firestore document for push notifications.
    private func saveFCMToken(for userId: String) {
        guard let token = Messaging.messaging().fcmToken else { return }
        let db = Firestore.firestore()
        db.collection("users").document(userId).updateData([
            "fcmToken": token
        ]) { error in
            if let error = error {
                print("⚠️ [FCM] Failed to save token: \(error.localizedDescription)")
            }
        }
    }
}
