package com.learnapp.flashcard.controller;

import com.learnapp.flashcard.common.ApiResponse;
import com.learnapp.flashcard.dto.CardResponse;
import com.learnapp.flashcard.dto.CreateCardRequest;
import com.learnapp.flashcard.service.impl.CardServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decks/{deckId}/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardServiceImpl cardService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCards(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId) {
        return ResponseEntity.ok(ApiResponse.success(cardService.getCardsByDeck(deckId, userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CardResponse>> createCard(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId,
            @Valid @RequestBody CreateCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(cardService.createCard(deckId, userId, request)));
    }

    @PatchMapping("/{cardId}")
    public ResponseEntity<ApiResponse<CardResponse>> updateCard(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId,
            @PathVariable UUID cardId,
            @RequestBody CreateCardRequest request) {
        return ResponseEntity.ok(ApiResponse.success(cardService.updateCard(cardId, userId, request)));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteCard(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID deckId,
            @PathVariable UUID cardId) {
        cardService.deleteCard(cardId, userId);
        return ResponseEntity.noContent().build();
    }
}
