package com.learnapp.notification.dto;

import com.learnapp.notification.entity.NotificationLog;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        UUID referenceId,
        boolean isRead,
        Instant sentAt
) {
    public static NotificationResponse from(NotificationLog log) {
        return new NotificationResponse(
                log.getId(), log.getType(), log.getTitle(),
                log.getMessage(), log.getReferenceId(),
                log.isRead(), log.getSentAt()
        );
    }
}
