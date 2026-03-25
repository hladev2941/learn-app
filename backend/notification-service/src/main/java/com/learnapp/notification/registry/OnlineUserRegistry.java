package com.learnapp.notification.registry;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

/**
 * Tracks users currently connected via WebSocket.
 * Stores Redis keys "ws:online:{userId}" with 30-minute TTL.
 */
@Component
@RequiredArgsConstructor
public class OnlineUserRegistry {

    private static final String KEY_PREFIX = "ws:online:";
    private static final Duration TTL = Duration.ofMinutes(30);

    private final StringRedisTemplate redis;

    public void markOnline(UUID userId) {
        redis.opsForValue().set(KEY_PREFIX + userId, "1", TTL);
    }

    public void markOffline(UUID userId) {
        redis.delete(KEY_PREFIX + userId);
    }

    public boolean isOnline(UUID userId) {
        return Boolean.TRUE.equals(redis.hasKey(KEY_PREFIX + userId));
    }
}
