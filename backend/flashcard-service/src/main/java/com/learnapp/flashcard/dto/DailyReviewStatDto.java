package com.learnapp.flashcard.dto;

public record DailyReviewStatDto(
        String date,           // ISO: "2026-03-20"
        long reviewCount,      // total cards reviewed
        long goodCount,        // GOOD + EASY ratings
        int retentionPercent   // goodCount / reviewCount * 100
) {}
