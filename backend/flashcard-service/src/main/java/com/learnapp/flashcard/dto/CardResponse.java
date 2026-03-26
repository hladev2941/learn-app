package com.learnapp.flashcard.dto;

import com.learnapp.flashcard.entity.Card;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CardResponse(
        UUID id,
        UUID deckId,
        String frontText,
        String frontImageUrl,
        String backText,
        String backImageUrl,
        int fsrsState,
        LocalDate nextReviewDate,
        LocalDate lastReviewDate,
        List<String> tags,
        Instant createdAt,
        Instant updatedAt,
        String source,
        String contentFormat
) {
    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getDeck().getId(),
                card.getFrontText(),
                card.getFrontImageUrl(),
                card.getBackText(),
                card.getBackImageUrl(),
                card.getFsrsState(),
                card.getNextReviewDate(),
                card.getLastReviewDate(),
                card.getTags().stream().map(t -> t.getName()).toList(),
                card.getCreatedAt(),
                card.getUpdatedAt(),
                card.getSource(),
                card.getContentFormat()
        );
    }
}
