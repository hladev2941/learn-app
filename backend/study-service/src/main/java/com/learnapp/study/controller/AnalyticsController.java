package com.learnapp.study.controller;

import com.learnapp.study.common.ApiResponse;
import com.learnapp.study.dto.DailyStatDto;
import com.learnapp.study.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/v1/analytics/study?days=7&timezone=Asia/Ho_Chi_Minh
     * Returns daily study stats for the authenticated user over the last N days.
     */
    @GetMapping("/study")
    public ResponseEntity<ApiResponse<List<DailyStatDto>>> getStudyStats(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "Asia/Ho_Chi_Minh") String timezone) {

        // Clamp days to valid range [1, 90]
        int clampedDays = Math.max(1, Math.min(days, 90));

        List<DailyStatDto> stats = analyticsService.getDailyStudyStats(userId, clampedDays, timezone);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
