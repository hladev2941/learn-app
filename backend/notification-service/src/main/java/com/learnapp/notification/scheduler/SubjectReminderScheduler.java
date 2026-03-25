package com.learnapp.notification.scheduler;

import com.learnapp.notification.feign.FlashcardFeignClient;
import com.learnapp.notification.model.NotificationMessage;
import com.learnapp.notification.repository.NotificationLogRepository;
import com.learnapp.notification.service.NotificationDispatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Runs every minute.
 * Fetches subjects with due reminders from flashcard-service
 * and delivers in-app notifications to users who are currently online.
 * Deduplicates: skips if the same notification was sent within the last hour.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubjectReminderScheduler {

    private final FlashcardFeignClient flashcardFeignClient;
    private final NotificationDispatcher dispatcher;
    private final NotificationLogRepository logRepository;

    @Scheduled(cron = "0 * * * * *")
    public void checkSubjectReminders() {
        try {
            var dueReminders = flashcardFeignClient.getDueReminders();
            if (dueReminders.isEmpty()) return;

            log.debug("Subject reminder check — {} due", dueReminders.size());

            for (var reminder : dueReminders) {
                // Skip if already sent within the last hour for this subject
                boolean alreadySent = logRepository.existsByUserIdAndTypeAndReferenceIdAndSentAtAfter(
                        reminder.userId(), "SUBJECT_REMINDER",
                        reminder.subjectId(), Instant.now().minus(1, ChronoUnit.HOURS));
                if (alreadySent) continue;

                dispatcher.send(
                        reminder.userId(),
                        NotificationMessage.of("SUBJECT_REMINDER",
                                "Nhắc nhở: " + reminder.subjectName(),
                                reminder.message()),
                        "SUBJECT_REMINDER",
                        reminder.subjectId()
                );
            }
        } catch (Exception e) {
            log.error("SubjectReminderScheduler error: {}", e.getMessage());
        }
    }
}
