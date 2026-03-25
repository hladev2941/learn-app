package com.learnapp.study.service.impl;

import com.learnapp.study.dto.StreakResponse;
import com.learnapp.study.entity.Streak;
import com.learnapp.study.feign.AuthFeignClient;
import com.learnapp.study.repository.StreakRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreakServiceImpl {

    private final StreakRepository streakRepository;
    private final AuthFeignClient authFeignClient;

    public StreakResponse getStreak(UUID userId) {
        return streakRepository.findById(userId)
                .map(StreakResponse::from)
                .orElse(new StreakResponse(0, 0, null, false));
    }

    @Transactional
    public StreakResponse updateAfterSession(UUID userId) {
        // Get user's timezone from auth-service via Feign
        String timezone = "Asia/Ho_Chi_Minh";
        try {
            timezone = authFeignClient.getUserTimezone(userId);
        } catch (Exception e) {
            log.warn("Could not fetch timezone for user {}, using default", userId);
        }

        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        Streak streak = streakRepository.findById(userId)
                .orElse(Streak.builder().userId(userId).build());

        if (today.equals(streak.getLastStudyDate())) {
            // Already studied today — no change
            return StreakResponse.from(streak);
        }

        LocalDate yesterday = today.minusDays(1);
        if (yesterday.equals(streak.getLastStudyDate())) {
            // Consecutive day — increment streak
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else {
            // Streak broken — reset to 1
            streak.setCurrentStreak(1);
        }

        streak.setLastStudyDate(today);
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        return StreakResponse.from(streakRepository.save(streak));
    }

    /**
     * Called by StreakResetScheduler daily — reset streak for users who missed a day.
     */
    @Transactional
    public void resetMissedStreaks(String timezone) {
        LocalDate yesterday = LocalDate.now(ZoneId.of(timezone)).minusDays(1);
        List<Streak> toReset = streakRepository.findAll().stream()
                .filter(s -> s.getLastStudyDate() != null && s.getLastStudyDate().isBefore(yesterday))
                .toList();

        toReset.forEach(s -> s.setCurrentStreak(0));
        streakRepository.saveAll(toReset);
        log.info("Reset streaks for {} users", toReset.size());
    }
}
