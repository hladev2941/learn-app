package com.learnapp.study.service.impl;

import com.learnapp.study.dto.BadgeDto;
import com.learnapp.study.entity.BadgeDefinition;
import com.learnapp.study.entity.RewardLog;
import com.learnapp.study.repository.RewardLogRepository;
import com.learnapp.study.repository.StudySessionRepository;
import com.learnapp.study.service.BadgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeServiceImpl implements BadgeService {

    private final RewardLogRepository rewardLogRepository;
    private final StudySessionRepository studySessionRepository;

    @Override
    public List<BadgeDto> getUserBadges(UUID userId) {
        // Get all earned badge codes with their earned timestamps
        Map<String, Instant> earnedMap = new HashMap<>();
        rewardLogRepository.findEarnedBadgesByUser(userId)
                .forEach(row -> earnedMap.put((String) row[0], (Instant) row[1]));

        return Arrays.stream(BadgeDefinition.values())
                .map(def -> new BadgeDto(
                        def.code,
                        def.name,
                        def.description,
                        def.emoji,
                        earnedMap.containsKey(def.code),
                        earnedMap.get(def.code)
                ))
                .toList();
    }

    @Override
    @Transactional
    public String checkAndGrantBadges(UUID userId, UUID sessionId,
                                      String sessionType, int streakDays,
                                      int durationSecs, Instant startedAt, String timezone) {
        // Collect already-earned badge codes (avoid duplicates)
        Set<String> alreadyEarned = new HashSet<>();
        rewardLogRepository.findEarnedBadgesByUser(userId)
                .forEach(row -> alreadyEarned.add((String) row[0]));

        // Total pomodoro sessions ever
        long totalSessions = studySessionRepository.countByUserId(userId);

        // Hour in user's timezone
        int hour = ZonedDateTime.ofInstant(startedAt, ZoneId.of(timezone)).getHour();

        List<String> newBadges = new ArrayList<>();

        checkAndCollect(newBadges, alreadyEarned, "first_session",  totalSessions == 1);
        checkAndCollect(newBadges, alreadyEarned, "pomodoro_5",     "POMODORO".equals(sessionType) && countPomodoros(userId) >= 5);
        checkAndCollect(newBadges, alreadyEarned, "pomodoro_25",    "POMODORO".equals(sessionType) && countPomodoros(userId) >= 25);
        checkAndCollect(newBadges, alreadyEarned, "streak_3",       streakDays >= 3);
        checkAndCollect(newBadges, alreadyEarned, "streak_7",       streakDays >= 7);
        checkAndCollect(newBadges, alreadyEarned, "streak_30",      streakDays >= 30);
        checkAndCollect(newBadges, alreadyEarned, "night_owl",      hour >= 22);
        checkAndCollect(newBadges, alreadyEarned, "early_bird",     hour < 6);
        checkAndCollect(newBadges, alreadyEarned, "marathon",       durationSecs >= 3600);
        checkAndCollect(newBadges, alreadyEarned, "centurion",      totalSessions >= 100);

        if (newBadges.isEmpty()) return null;

        // Persist all newly earned badges
        for (String code : newBadges) {
            rewardLogRepository.save(RewardLog.builder()
                    .userId(userId)
                    .sessionId(sessionId)
                    .rewardType("BADGE")
                    .badgeCode(code)
                    .build());
            log.info("Badge granted: {} → user {}", code, userId);
        }

        // Return only the first badge for the popup
        return newBadges.get(0);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void checkAndCollect(List<String> newBadges, Set<String> alreadyEarned,
                                  String code, boolean condition) {
        if (condition && !alreadyEarned.contains(code)) {
            newBadges.add(code);
        }
    }

    private long countPomodoros(UUID userId) {
        return studySessionRepository.countByUserIdAndSessionType(userId, "POMODORO");
    }
}
