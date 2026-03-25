package com.learnapp.study.dto;

import com.learnapp.study.entity.Streak;

import java.time.LocalDate;

public record StreakResponse(
        int currentStreak,
        int longestStreak,
        LocalDate lastStudyDate,
        boolean studiedToday
) {
    public static StreakResponse from(Streak streak) {
        return new StreakResponse(
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getLastStudyDate(),
                LocalDate.now().equals(streak.getLastStudyDate())
        );
    }
}
