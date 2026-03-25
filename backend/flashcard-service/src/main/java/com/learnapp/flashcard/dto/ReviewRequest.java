package com.learnapp.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewRequest(
        @NotNull UUID cardId,
        @NotBlank String rating,   // AGAIN | HARD | GOOD | EASY
        Integer reviewDurationMs
) {}
