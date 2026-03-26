package com.learnapp.study.controller;

import com.learnapp.study.common.ApiResponse;
import com.learnapp.study.dto.GoalDto;
import com.learnapp.study.dto.GoalProgressDto;
import com.learnapp.study.entity.UserGoal;
import com.learnapp.study.feign.AuthFeignClient;
import com.learnapp.study.repository.StudySessionRepository;
import com.learnapp.study.repository.UserGoalRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    // Default values when no goal has been set yet
    private static final int DEFAULT_STUDY_MINUTES = 60;
    private static final int DEFAULT_CARDS_PER_DAY  = 20;

    private final UserGoalRepository userGoalRepository;
    private final StudySessionRepository sessionRepository;
    private final AuthFeignClient authFeignClient;

    /**
     * GET /api/v1/goals/me
     * Returns the user's goal + today's actual progress.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<GoalProgressDto>> getGoalProgress(
            @RequestHeader("X-User-Id") UUID userId) {

        // 1. Resolve today's date using the user's timezone
        String timezone = resolveTimezone(userId);
        LocalDate today = LocalDate.now(ZoneId.of(timezone));

        // 2. Load goal (fall back to defaults if not set)
        UserGoal goal = userGoalRepository.findById(userId).orElseGet(() ->
                UserGoal.builder()
                        .userId(userId)
                        .goalStudyMinutesPerDay(DEFAULT_STUDY_MINUTES)
                        .goalCardsPerDay(DEFAULT_CARDS_PER_DAY)
                        .build()
        );

        int goalMinutes = goal.getGoalStudyMinutesPerDay();
        int goalCards   = goal.getGoalCardsPerDay();

        // 3. Query today's actual study data
        long todaySeconds  = sessionRepository.sumDurationByUserAndDate(userId, today);
        long todaySessions = sessionRepository.countCompletedByUserAndDate(userId, today);

        int actualMinutes = (int) (todaySeconds / 60);

        // 4. Compute progress (capped at 100%)
        int progressPercent = (goalMinutes > 0)
                ? Math.min(100, actualMinutes * 100 / goalMinutes)
                : 0;

        GoalProgressDto dto = new GoalProgressDto(
                goalMinutes,
                goalCards,
                actualMinutes,
                todaySessions,
                progressPercent,
                progressPercent >= 100
        );

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * PUT /api/v1/goals/me
     * Creates or updates the user's daily study goal.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<GoalProgressDto>> upsertGoal(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody GoalDto request) {

        // Upsert: load existing or create new, then save
        UserGoal goal = userGoalRepository.findById(userId).orElseGet(() ->
                UserGoal.builder().userId(userId).build()
        );

        goal.setGoalStudyMinutesPerDay(request.goalStudyMinutesPerDay());
        goal.setGoalCardsPerDay(request.goalCardsPerDay());
        userGoalRepository.save(goal);

        // Re-use GET logic to return up-to-date progress
        return getGoalProgress(userId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String resolveTimezone(UUID userId) {
        try {
            return authFeignClient.getUserTimezone(userId);
        } catch (Exception e) {
            log.warn("Could not fetch timezone for user {}, defaulting to Asia/Ho_Chi_Minh", userId);
            return "Asia/Ho_Chi_Minh";
        }
    }
}
