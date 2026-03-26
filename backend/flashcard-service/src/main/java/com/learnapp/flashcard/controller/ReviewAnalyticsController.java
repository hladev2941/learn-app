package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.DailyReviewStatDto;
import com.learnapp.flashcard.repository.CardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewAnalyticsController {

    private final CardReviewRepository cardReviewRepository;

    /**
     * GET /api/v1/reviews/analytics?days=7&timezone=Asia/Ho_Chi_Minh
     * Returns daily review stats for the last N days, filling zeros for missing days.
     */
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<List<DailyReviewStatDto>>> getReviewAnalytics(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "Asia/Ho_Chi_Minh") String timezone) {

        ZoneId zoneId;
        try { zoneId = ZoneId.of(timezone); } catch (Exception e) { zoneId = ZoneId.of("Asia/Ho_Chi_Minh"); }

        LocalDate today = LocalDate.now(zoneId);
        LocalDate from  = today.minusDays(days - 1);

        // Query raw rows
        List<Object[]> rows = cardReviewRepository.findDailyReviewStats(userId, from, today);
        Map<LocalDate, Object[]> byDate = new LinkedHashMap<>();
        for (Object[] row : rows) byDate.put((LocalDate) row[0], row);

        // Fill all days (including zeros)
        List<DailyReviewStatDto> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
            if (byDate.containsKey(d)) {
                Object[] row    = byDate.get(d);
                long total      = ((Number) row[1]).longValue();
                long good       = ((Number) row[2]).longValue();
                int retention   = total == 0 ? 0 : (int) Math.round(good * 100.0 / total);
                result.add(new DailyReviewStatDto(d.toString(), total, good, retention));
            } else {
                result.add(new DailyReviewStatDto(d.toString(), 0, 0, 0));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
