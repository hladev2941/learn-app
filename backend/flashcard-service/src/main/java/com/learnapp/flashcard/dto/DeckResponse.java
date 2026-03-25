package com.learnapp.flashcard.dto;

import com.learnapp.flashcard.entity.Deck;

import java.time.Instant;
import java.util.UUID;

public record DeckResponse(
        UUID id,
        String name,
        String description,
        String coverColor,
        int cardCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static DeckResponse from(Deck deck) {
        return new DeckResponse(deck.getId(), deck.getName(), deck.getDescription(),
                deck.getCoverColor(), deck.getCardCount(), deck.getCreatedAt(), deck.getUpdatedAt());
    }
}
