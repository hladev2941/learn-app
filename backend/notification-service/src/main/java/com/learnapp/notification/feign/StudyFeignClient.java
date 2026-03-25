package com.learnapp.notification.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Calls study-service internal API to get streak data for notifications.
 */
@FeignClient(name = "study-service", url = "${services.study-url}", path = "/internal/streaks")
public interface StudyFeignClient {

    /** Returns users with current_streak > 0 who haven't studied on the given date. */
    @GetMapping("/at-risk")
    List<AtRiskStreakDto> getAtRiskStreaks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date);

    record AtRiskStreakDto(UUID userId, int currentStreak) {}
}
