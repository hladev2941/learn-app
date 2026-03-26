package com.learnapp.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateCardRequest(
        @NotNull UUID deckId,
        @NotBlank String frontText,
        String frontImageUrl,
        @NotBlank String backText,
        String backImageUrl,
        List<String> tags,
        String source,
        String contentFormat
) {}
