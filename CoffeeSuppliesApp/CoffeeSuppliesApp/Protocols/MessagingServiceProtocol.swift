import Foundation

/// Protocol wrapping Firebase Cloud Messaging operations for testability.
protocol MessagingServiceProtocol {
    /// Register for push notifications and return the FCM token.
    func registerForPushNotifications() async throws -> String

    /// Get the current FCM token, if available.
    var currentToken: String? { get }

    /// Subscribe to a topic.
    func subscribe(to topic: String) async throws

    /// Unsubscribe from a topic.
    func unsubscribe(from topic: String) async throws
}
