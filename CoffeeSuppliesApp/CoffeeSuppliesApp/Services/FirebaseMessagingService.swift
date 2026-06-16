import Foundation
import FirebaseMessaging
import UserNotifications

/// Production Firebase Cloud Messaging service implementation.
final class FirebaseMessagingService: MessagingServiceProtocol {
    var currentToken: String? {
        Messaging.messaging().fcmToken
    }

    func registerForPushNotifications() async throws -> String {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])

        guard granted else {
            throw MessagingServiceError.permissionDenied
        }

        guard let token = Messaging.messaging().fcmToken else {
            throw MessagingServiceError.tokenUnavailable
        }

        return token
    }

    func subscribe(to topic: String) async throws {
        try await Messaging.messaging().subscribe(toTopic: topic)
    }

    func unsubscribe(from topic: String) async throws {
        try await Messaging.messaging().unsubscribe(fromTopic: topic)
    }
}

enum MessagingServiceError: Error, LocalizedError {
    case permissionDenied
    case tokenUnavailable

    var errorDescription: String? {
        switch self {
        case .permissionDenied: return "Push notification permission was denied."
        case .tokenUnavailable: return "FCM token is not available."
        }
    }
}
