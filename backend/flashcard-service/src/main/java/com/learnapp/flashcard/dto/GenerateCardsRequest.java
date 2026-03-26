package com.learnapp.flashcard.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record GenerateCardsRequest(
        @NotBlank @Size(max = 5000) String text,
        @NotNull UUID deckId,
        @Min(1) @Max(20) int maxCards
) {
    // Default constructor with sensible maxCards default
    public GenerateCardsRequest {
        if (maxCards <= 0) maxCards = 10;
    }
}
