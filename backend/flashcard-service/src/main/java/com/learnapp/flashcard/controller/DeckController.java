package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.CreateDeckRequest;
import com.learnapp.flashcard.dto.DeckResponse;
import com.learnapp.flashcard.service.impl.DeckServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckServiceImpl deckService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeckResponse>>> getDecks(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(deckService.getUserDecks(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeckResponse>> createDeck(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateDeckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(deckService.createDeck(userId, request)));
    }

    @PatchMapping("/{deckId}")
    public ResponseEntity<ApiResponse<DeckResponse>> updateDeck(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId,
            @Valid @RequestBody CreateDeckRequest request) {
        return ResponseEntity.ok(ApiResponse.success(deckService.updateDeck(deckId, userId, request)));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId) {
        deckService.deleteDeck(deckId, userId);
        return ResponseEntity.noContent().build();
    }
}
