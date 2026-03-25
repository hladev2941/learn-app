package com.learnapp.flashcard.internal;

import com.learnapp.flashcard.repository.CardRepository;
import com.learnapp.flashcard.repository.CardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Internal API — called by study-service via Feign for analytics.
 * NOT routed through api-gateway.
 */
@RestController
@RequestMapping("/internal/reviews")
@RequiredArgsConstructor
public class InternalReviewController {

    private final CardReviewRepository reviewRepository;
    private final CardRepository cardRepository;

    @GetMapping("/stats/{userId}")
    public ResponseEntity<ReviewStatsResponse> getStats(
            @PathVariable UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        long totalReviewed = reviewRepository.countByUserIdAndReviewDate(userId, date);
        long goodReviews   = reviewRepository.countGoodReviewsByDate(userId, date);
        long dueToday      = cardRepository.countDueCards(userId, LocalDate.now());

        double retention = totalReviewed > 0 ? (double) goodReviews / totalReviewed : 0.0;

        return ResponseEntity.ok(new ReviewStatsResponse(
                (int) totalReviewed,
                (int) dueToday,
                Math.round(retention * 100.0) / 100.0
        ));
    }

    record ReviewStatsResponse(int totalReviewed, int dueToday, double retentionRate) {}
}
