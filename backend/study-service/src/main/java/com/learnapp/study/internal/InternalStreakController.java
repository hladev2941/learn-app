package com.learnapp.study.internal;

import com.learnapp.study.entity.Streak;
import com.learnapp.study.repository.StreakRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Internal API — called by notification-service via Feign.
 * NOT exposed through api-gateway.
 */
@RestController
@RequestMapping("/internal/streaks")
@RequiredArgsConstructor
public class InternalStreakController {

    private final StreakRepository streakRepository;

    /**
     * Returns users with an active streak who haven't studied on the given date.
     * Used by StreakWarningScheduler in notification-service.
     */
    @GetMapping("/at-risk")
    public ResponseEntity<List<AtRiskStreakDto>> getAtRiskStreaks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<AtRiskStreakDto> result = streakRepository
                .findUsersWithActiveStreakNotStudiedToday(date)
                .stream()
                .map(s -> new AtRiskStreakDto(s.getUserId(), s.getCurrentStreak()))
                .toList();

        return ResponseEntity.ok(result);
    }

    record AtRiskStreakDto(UUID userId, int currentStreak) {}
}
