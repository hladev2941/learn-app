package com.learnapp.study.dto;

public record GoalProgressDto(
        int goalStudyMinutesPerDay,
        int goalCardsPerDay,
        int actualStudyMinutesToday,
        long actualSessionsToday,
        int progressStudyPercent,
        boolean studyGoalMet
) {}
