package com.learnapp.flashcard.dto;

import com.learnapp.flashcard.entity.Subject;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record SubjectResponse(
        UUID id,
        String name,
        String emoji,
        String color,
        boolean reminderEnabled,
        String reminderType,
        Integer reminderInterval,
        String reminderTime,
        List<String> reminderDays,
        int deckCount,
        int totalCardCount,
        int dueCardCount,
        int masteredCardCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static SubjectResponse from(Subject s, int deckCount) {
        return from(s, deckCount, 0, 0, 0);
    }

    public static SubjectResponse from(Subject s, int deckCount, int totalCardCount, int dueCardCount, int masteredCardCount) {
        List<String> days = (s.getReminderDays() != null && !s.getReminderDays().isBlank())
                ? Arrays.asList(s.getReminderDays().split(","))
                : List.of();
        String time = s.getReminderTime() != null
                ? s.getReminderTime().toString().substring(0, 5)
                : null;
        return new SubjectResponse(
                s.getId(), s.getName(), s.getEmoji(), s.getColor(),
                s.isReminderEnabled(), s.getReminderType(), s.getReminderInterval(), time, days,
                deckCount, totalCardCount, dueCardCount, masteredCardCount,
                s.getCreatedAt(), s.getUpdatedAt()
        );
    }
}
