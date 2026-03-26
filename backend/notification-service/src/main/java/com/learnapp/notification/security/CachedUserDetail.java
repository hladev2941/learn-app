package com.learnapp.notification.security;

/** User detail cached in Redis by auth-service after login. Key: user:detail:{userId} */
public record CachedUserDetail(
        String id,
        String email,
        String displayName,
        String role,
        String timezone
) {}
