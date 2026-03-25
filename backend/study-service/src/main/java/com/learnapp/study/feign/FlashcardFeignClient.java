package com.learnapp.study.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Feign client gọi internal API của flashcard-service.
 * URL resolved via Docker DNS (no Eureka).
 */
@FeignClient(name = "flashcard-service", url = "${services.flashcard-url}", path = "/internal/reviews")
public interface FlashcardFeignClient {

    @GetMapping("/stats/{userId}")
    ReviewStatsResponse getReviewStats(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date);

    record ReviewStatsResponse(int totalReviewed, int dueToday, double retentionRate) {}
}
