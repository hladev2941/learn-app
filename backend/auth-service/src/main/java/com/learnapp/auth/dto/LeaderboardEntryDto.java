package com.learnapp.auth.dto;

import java.util.UUID;

public record LeaderboardEntryDto(
        int rank,
        UUID userId,
        String displayName,
        String avatarUrl,
        int xpTotal,
        int coinBalance,
        boolean isCurrentUser
) {}
