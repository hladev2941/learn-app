package com.learnapp.study.dto;

import java.time.Instant;

public record BadgeDto(
        String code,
        String name,
        String description,
        String emoji,
        boolean earned,
        Instant earnedAt   // null when not yet earned
) {}
