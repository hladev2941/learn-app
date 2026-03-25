package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.ReviewRequest;
import com.learnapp.flashcard.entity.Card;
import com.learnapp.flashcard.repository.CardRepository;
import com.learnapp.flashcard.service.impl.SpacedRepetitionServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final SpacedRepetitionServiceImpl srService;
    private final CardRepository cardRepository;

    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<Card>>> getDueCards(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(
                cardRepository.findDueCards(userId, LocalDate.now())));
    }

    @GetMapping("/due/count")
    public ResponseEntity<ApiResponse<Long>> getDueCount(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(
                cardRepository.countDueCards(userId, LocalDate.now())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitReview(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ReviewRequest request) {
        srService.processReview(request.cardId(), userId, request.rating(), request.reviewDurationMs());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
