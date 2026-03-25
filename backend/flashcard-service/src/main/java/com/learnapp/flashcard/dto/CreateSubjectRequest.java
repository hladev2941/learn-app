package com.learnapp.flashcard.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateSubjectRequest(
        @NotBlank String name,
        String emoji,
        String color,
        boolean reminderEnabled,
        String reminderType,       // "MINUTES" | "HOURS" | "DAILY" | "WEEKLY"
        Integer reminderInterval,  // for MINUTES/HOURS
        String reminderTime,       // "HH:mm" for DAILY/WEEKLY
        List<String> reminderDays  // ["MON","WED","FRI"] for WEEKLY
) {}
