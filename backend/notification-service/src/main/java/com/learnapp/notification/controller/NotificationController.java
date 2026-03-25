package com.learnapp.notification.controller;

import com.learnapp.notification.common.ApiResponse;
import com.learnapp.notification.dto.NotificationResponse;
import com.learnapp.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationLogRepository logRepository;

    /** Get recent notifications (max 50) for the authenticated user. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @RequestHeader("X-User-Id") UUID userId) {

        List<NotificationResponse> list = logRepository
                .findTop50ByUserIdOrderBySentAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** Unread count for the bell badge. */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {

        int count = logRepository.countByUserIdAndIsReadFalse(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    /** Mark all notifications as read. */
    @Transactional
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @RequestHeader("X-User-Id") UUID userId) {

        logRepository.markAllReadByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
