package com.learnapp.notification.service;

import com.learnapp.notification.entity.NotificationLog;
import com.learnapp.notification.model.NotificationMessage;
import com.learnapp.notification.registry.OnlineUserRegistry;
import com.learnapp.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Core service of notification-service.
 * Checks if the target user is online, sends the STOMP message,
 * and persists a log entry for history / unread count.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineUserRegistry onlineUserRegistry;
    private final NotificationLogRepository logRepository;

    /**
     * Send an in-app notification to a user.
     *
     * @param userId      target user
     * @param notification message DTO
     * @param type        notification type code
     * @param referenceId optional related entity ID (subjectId, deckId, …)
     * @return true if the user was online and the message was dispatched
     */
    public boolean send(UUID userId, NotificationMessage notification,
                        String type, UUID referenceId) {
        boolean online = onlineUserRegistry.isOnline(userId);

        // Persist log regardless of online status (for history)
        logRepository.save(NotificationLog.builder()
                .userId(userId)
                .type(type)
                .title(notification.title())
                .message(notification.message())
                .referenceId(referenceId)
                .sentVia(online ? "WS" : "QUEUED")
                .build());

        if (!online) {
            log.debug("User {} offline — notification queued in log only", userId);
            return false;
        }

        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
            log.debug("Notification [{}] delivered to user {} via WS", type, userId);
            return true;
        } catch (Exception e) {
            log.error("WS dispatch failed for user {}: {}", userId, e.getMessage());
            return false;
        }
    }
}
