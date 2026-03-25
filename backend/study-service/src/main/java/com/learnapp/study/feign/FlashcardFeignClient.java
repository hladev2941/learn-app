package com.learnapp.study.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Feign client gọi internal API của flashcard-service.
 * URL resolved via Docker DNS (no Eureka).
 * Base path changed to /internal so both /reviews and /subjects can be called.
 */
@FeignClient(name = "flashcard-service", url = "${services.flashcard-url}", path = "/internal")
public interface FlashcardFeignClient {

    @GetMapping("/reviews/stats/{userId}")
    ReviewStatsResponse getReviewStats(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date);

    /** Returns subjects whose reminder is due at the current minute. */
    @GetMapping("/subjects/due-reminders")
    List<DueReminderDto> getDueReminders();

    record ReviewStatsResponse(int totalReviewed, int dueToday, double retentionRate) {}

    record DueReminderDto(UUID userId, UUID subjectId, String subjectName, String message) {}
}
