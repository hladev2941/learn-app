package com.learnapp.study.service;

import com.learnapp.study.dto.BadgeDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BadgeService {

    /** Returns all badge definitions merged with which ones the user has earned. */
    List<BadgeDto> getUserBadges(UUID userId);

    /**
     * Checks badge conditions after a session completes and persists any newly
     * earned badges. Returns the code of the first newly granted badge, or null.
     */
    String checkAndGrantBadges(UUID userId, UUID sessionId,
                               String sessionType, int streakDays,
                               int durationSecs, Instant startedAt, String timezone);
}
