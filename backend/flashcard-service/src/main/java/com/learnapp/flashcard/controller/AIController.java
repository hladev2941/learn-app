package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.GenerateCardsRequest;
import com.learnapp.flashcard.service.impl.ClaudeApiService;
import com.learnapp.flashcard.service.impl.ClaudeApiService.GeneratedCard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final ClaudeApiService claudeApiService;

    /**
     * Generates flashcard suggestions from raw text using Claude AI.
     * Returns suggestions only — cards are NOT saved to the database.
     * The client selects which cards to save and calls the card creation endpoint separately.
     *
     * POST /api/v1/ai/generate-cards
     * Requires X-User-Id header (set by gateway after JWT validation).
     */
    @PostMapping("/generate-cards")
    public ResponseEntity<ApiResponse<List<GeneratedCard>>> generateCards(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody GenerateCardsRequest request) {

        int maxCards = Math.min(request.maxCards(), 20);
        List<GeneratedCard> cards = claudeApiService.generateFlashcards(request.text(), maxCards);
        return ResponseEntity.ok(ApiResponse.success(cards, "Generated " + cards.size() + " cards"));
    }
}
