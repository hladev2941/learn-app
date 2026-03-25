package com.learnapp.notification.repository;

import com.learnapp.notification.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {

    /** Deduplication check — was this type+reference already sent within the time window? */
    boolean existsByUserIdAndTypeAndReferenceIdAndSentAtAfter(
            UUID userId, String type, UUID referenceId, Instant after);

    /** Recent notifications for the bell panel (max 50). */
    List<NotificationLog> findTop50ByUserIdOrderBySentAtDesc(UUID userId);

    /** Unread badge count. */
    int countByUserIdAndIsReadFalse(UUID userId);

    /** Mark all notifications of a user as read. */
    @Modifying
    @Query("UPDATE NotificationLog n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllReadByUserId(@Param("userId") UUID userId);
}
