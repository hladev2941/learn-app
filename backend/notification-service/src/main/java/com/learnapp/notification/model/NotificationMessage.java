package com.learnapp.notification.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload pushed to the browser via STOMP /user/{userId}/queue/notifications.
 */
public record NotificationMessage(
        UUID id,
        String type,
        String title,
        String message,
        Instant sentAt
) {
    public static NotificationMessage of(String type, String title, String message) {
        return new NotificationMessage(UUID.randomUUID(), type, title, message, Instant.now());
    }
}
