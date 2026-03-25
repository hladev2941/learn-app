package com.learnapp.auth.dto;

import com.learnapp.auth.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String timezone,
        String role,
        int xpTotal,
        int coinBalance,
        boolean emailVerified,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getTimezone(),
                user.getRole().name(),
                user.getXpTotal(),
                user.getCoinBalance(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}
