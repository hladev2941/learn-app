package com.learnapp.notification.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.UUID;

/**
 * Calls flashcard-service internal API to get subjects with due reminders.
 */
@FeignClient(name = "flashcard-service", url = "${services.flashcard-url}", path = "/internal/subjects")
public interface FlashcardFeignClient {

    @GetMapping("/due-reminders")
    List<DueReminderDto> getDueReminders();

    record DueReminderDto(UUID userId, UUID subjectId, String subjectName, String message) {}
}
