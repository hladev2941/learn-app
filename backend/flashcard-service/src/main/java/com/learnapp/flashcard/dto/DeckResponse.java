package com.learnapp.flashcard.dto;

import com.learnapp.flashcard.entity.Deck;

import java.time.Instant;
import java.util.UUID;

public record DeckResponse(
        UUID id,
        UUID subjectId,
        String name,
        String description,
        String coverColor,
        int cardCount,
        int dueCardCount,
        int masteredCardCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static DeckResponse from(Deck deck) {
        return from(deck, 0, 0);
    }

    public static DeckResponse from(Deck deck, int dueCardCount, int masteredCardCount) {
        UUID subjectId = deck.getSubject() != null ? deck.getSubject().getId() : null;
        return new DeckResponse(deck.getId(), subjectId, deck.getName(), deck.getDescription(),
                deck.getCoverColor(), deck.getCardCount(), dueCardCount, masteredCardCount,
                deck.getCreatedAt(), deck.getUpdatedAt());
    }
}
