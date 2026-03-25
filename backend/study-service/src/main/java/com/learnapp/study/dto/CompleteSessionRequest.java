package com.learnapp.study.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CompleteSessionRequest(
        @Min(60) int durationSecs,
        @NotNull String sessionType,   // POMODORO | CUSTOM
        @NotNull Instant startedAt,
        @NotNull Instant endedAt
) {}
