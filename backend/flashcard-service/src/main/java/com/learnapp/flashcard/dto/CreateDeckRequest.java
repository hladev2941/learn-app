package com.learnapp.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDeckRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        String coverColor,
        UUID subjectId
) {}
