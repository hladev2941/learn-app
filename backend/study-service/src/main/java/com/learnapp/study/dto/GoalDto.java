package com.learnapp.study.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record GoalDto(
        @Min(10) @Max(480) int goalStudyMinutesPerDay,
        @Min(1) @Max(500) int goalCardsPerDay
) {}
